import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { ServiceChargesService } from '../service-charges/service-charges.service';
import {
  CreateMaintenanceDto,
  CreateWorkOrderDto,
  ListMaintenanceQueryDto,
  UpdateMaintenanceDto,
  UpdateWorkOrderDto,
} from './dto/maintenance.dto';

const include = {
  property: {
    select: {
      id: true,
      name: true,
      code: true,
      address: true,
      serviceChargeAccount: {
        select: { balanceAvailable: true, balanceReserved: true },
      },
    },
  },
  workOrders: { orderBy: { createdAt: 'desc' as const } },
};

/** Services fee: 2.5% of labour only (materials excluded) — Master BRD. */
export function calcServicesPlatformFee(labourAmount: number): number {
  return Math.round(labourAmount * 0.025 * 100) / 100;
}

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceCharges: ServiceChargesService,
  ) {}

  findAll(user: AuthUser, query: ListMaintenanceQueryDto) {
    this.assertCanView(user);
    return this.prisma.maintenanceRequest
      .findMany({
        where: {
          ...(query.status ? { status: query.status } : {}),
          ...(query.propertyId ? { propertyId: query.propertyId } : {}),
          ...(query.search
            ? {
                OR: [
                  { number: { contains: query.search } },
                  { description: { contains: query.search } },
                  { tenantName: { contains: query.search } },
                ],
              }
            : {}),
        },
        include,
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include,
    });
    if (!row) throw new NotFoundException('Maintenance request not found');
    return this.serialize(row);
  }

  async create(dto: CreateMaintenanceDto, user: AuthUser) {
    this.assertCanManage(user);
    const property = await this.prisma.propertyAsset.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const number = await this.nextNumber('MR');
    const row = await this.prisma.maintenanceRequest.create({
      data: {
        number,
        propertyId: dto.propertyId,
        unitLabel: dto.unitLabel,
        tenantName: dto.tenantName,
        tenantPhone: dto.tenantPhone,
        category: dto.category,
        component: dto.component,
        description: dto.description,
        urgency: dto.urgency ?? 'MEDIUM',
        photoUrls: dto.photoUrls ?? undefined,
      },
      include,
    });
    return this.serialize(row);
  }

  async update(id: string, dto: UpdateMaintenanceDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    const row = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: dto.status,
        urgency: dto.urgency,
        responsibility: dto.responsibility,
        category: dto.category,
        component: dto.component,
        description: dto.description,
      },
      include,
    });
    return this.serialize(row);
  }

  async createWorkOrder(requestId: string, dto: CreateWorkOrderDto, user: AuthUser) {
    this.assertCanManage(user);
    const request = await this.findOne(requestId, user);
    const number = await this.nextNumber('WO');
    const labour = dto.labourAmount ?? 0;
    const materials = dto.materialsAmount ?? 0;
    const platformFee = dto.platformFee ?? calcServicesPlatformFee(labour);
    const scSpend = labour + materials; // materials+labour recovered from SC when within SC
    const available = await this.serviceCharges.getAvailableBalance(request.propertyId);

    const forceLandlord = dto.withinServiceCharge === false;
    const withinSc = !forceLandlord && scSpend <= available + 0.001;
    const woStatus: WorkOrderStatus = withinSc ? 'ASSIGNED' : 'PENDING_SC_OR_LANDLORD';
    const requestStatus = withinSc ? 'ASSIGNED' : 'ESCALATED_LANDLORD';

    const [wo] = await this.prisma.$transaction([
      this.prisma.workOrder.create({
        data: {
          number,
          requestId,
          artisanName: dto.artisanName,
          artisanPhone: dto.artisanPhone,
          labourAmount: labour,
          materialsAmount: materials,
          platformFee,
          withinServiceCharge: withinSc,
          status: woStatus,
        },
      }),
      this.prisma.maintenanceRequest.update({
        where: { id: request.id },
        data: { status: requestStatus },
      }),
    ]);

    return {
      ...wo,
      labourAmount: Number(wo.labourAmount ?? 0),
      materialsAmount: Number(wo.materialsAmount ?? 0),
      platformFee: Number(wo.platformFee ?? 0),
      scAvailableAtAssign: available,
      gated: !withinSc,
      gateReason: withinSc
        ? null
        : `SC available ₦${available.toLocaleString()} is below estimated spend ₦${scSpend.toLocaleString()} — escalated to landlord / pending SC top-up`,
    };
  }

  async updateWorkOrder(id: string, dto: UpdateWorkOrderDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.prisma.workOrder.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!existing) throw new NotFoundException('Work order not found');

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        status: dto.status,
        artisanName: dto.artisanName,
        artisanPhone: dto.artisanPhone,
        tenantSatisfied: dto.tenantSatisfied,
        tenantRating: dto.tenantRating,
        tenantFeedback: dto.tenantFeedback,
        completedAt:
          dto.status === 'COMPLETED_PENDING_CONFIRM' ||
          dto.status === 'CONFIRMED' ||
          dto.status === 'CLOSED'
            ? new Date()
            : undefined,
      },
      include: { request: true },
    });

    // On tenant confirm / close within SC: post ledger debit (idempotent)
    if (
      existing.withinServiceCharge &&
      (dto.status === 'CONFIRMED' || dto.status === 'CLOSED' || dto.status === 'PAID')
    ) {
      const labour = Number(existing.labourAmount ?? 0);
      const materials = Number(existing.materialsAmount ?? 0);
      const amount = labour + materials;
      if (amount > 0) {
        await this.serviceCharges.debitForWorkOrder(
          existing.request.propertyId,
          existing.id,
          amount,
          `Maintenance WO ${existing.number}`,
        );
      }
      if (dto.status === 'CONFIRMED' || dto.status === 'CLOSED') {
        await this.prisma.maintenanceRequest.update({
          where: { id: existing.requestId },
          data: { status: 'CLOSED' },
        });
      }
    }

    return updated;
  }

  private serialize<T extends { property?: { serviceChargeAccount?: { balanceAvailable: unknown; balanceReserved: unknown } | null } | null }>(
    row: T,
  ) {
    const sc = row.property?.serviceChargeAccount;
    return {
      ...row,
      property: row.property
        ? {
            ...row.property,
            serviceChargeAccount: sc
              ? {
                  balanceAvailable: Number(sc.balanceAvailable),
                  balanceReserved: Number(sc.balanceReserved),
                }
              : null,
          }
        : row.property,
    };
  }

  private async nextNumber(prefix: string) {
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    return `${prefix}-${year}-${stamp}`;
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.SALES,
      UserRole.FOREMAN,
      UserRole.ENGINEER,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only PM, Finance, or Admin can manage maintenance');
    }
  }
}
