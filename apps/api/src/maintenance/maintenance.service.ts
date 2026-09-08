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
    return this.applyWorkOrderUpdate(id, dto);
  }

  /** Portal: list properties the signed-in user can raise maintenance against. */
  async portalProperties(user: AuthUser) {
    return this.resolvePortalPropertyAccess(user);
  }

  async portalList(user: AuthUser) {
    const access = await this.resolvePortalPropertyAccess(user);
    const propertyIds = access.map((p) => p.id);
    if (!propertyIds.length) return [];
    const rows = await this.prisma.maintenanceRequest.findMany({
      where: { propertyId: { in: propertyIds } },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.serialize(r));
  }

  async portalCreate(dto: CreateMaintenanceDto, user: AuthUser) {
    const access = await this.resolvePortalPropertyAccess(user);
    if (!access.some((p) => p.id === dto.propertyId)) {
      throw new ForbiddenException('Property not linked to your account');
    }
    const property = await this.prisma.propertyAsset.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    const number = await this.nextNumber('MR');
    const row = await this.prisma.maintenanceRequest.create({
      data: {
        number,
        propertyId: dto.propertyId,
        unitLabel: dto.unitLabel,
        tenantName:
          dto.tenantName ?? `${user.firstName} ${user.lastName}`.trim(),
        tenantPhone: dto.tenantPhone ?? dbUser?.phone ?? undefined,
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

  async portalConfirmWorkOrder(
    workOrderId: string,
    dto: {
      tenantSatisfied?: boolean;
      tenantRating?: number;
      tenantFeedback?: string;
    },
    user: AuthUser,
  ) {
    const access = await this.resolvePortalPropertyAccess(user);
    const propertyIds = new Set(access.map((p) => p.id));
    const existing = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { request: true },
    });
    if (!existing) throw new NotFoundException('Work order not found');
    if (!propertyIds.has(existing.request.propertyId)) {
      throw new ForbiddenException('Work order not linked to your account');
    }
    if (
      existing.status !== 'COMPLETED_PENDING_CONFIRM' &&
      existing.status !== 'IN_PROGRESS' &&
      existing.status !== 'ASSIGNED'
    ) {
      throw new ForbiddenException('Work order is not awaiting confirmation');
    }
    return this.applyWorkOrderUpdate(workOrderId, {
      status: 'CONFIRMED',
      tenantSatisfied: dto.tenantSatisfied ?? true,
      tenantRating: dto.tenantRating,
      tenantFeedback: dto.tenantFeedback,
    });
  }

  private async applyWorkOrderUpdate(id: string, dto: UpdateWorkOrderDto) {
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

  private async resolvePortalPropertyAccess(user: AuthUser) {
    const byId = new Map<string, { id: string; name: string; address: string; unitLabel?: string | null }>();

    if (user.role === UserRole.CEO || user.role === UserRole.ADMIN) {
      const all = await this.prisma.propertyAsset.findMany({
        select: { id: true, name: true, address: true },
        orderBy: { name: 'asc' },
        take: 100,
      });
      for (const p of all) byId.set(p.id, p);
      return [...byId.values()];
    }

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    const or: { tenantEmail?: string; tenantPhone?: string }[] = [{ tenantEmail: user.email }];
    if (dbUser?.phone) or.push({ tenantPhone: dbUser.phone });

    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        status: { in: ['ACTIVE', 'DRAFT', 'RENEWAL_PENDING'] },
        OR: or,
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        unit: { select: { unitCode: true } },
      },
    });
    for (const t of tenancies) {
      byId.set(t.property.id, {
        id: t.property.id,
        name: t.property.name,
        address: t.property.address,
        unitLabel: t.unit?.unitCode ?? null,
      });
    }

    const client = await this.prisma.client.findUnique({
      where: { portalUserId: user.id },
    });
    if (client) {
      const links = await this.prisma.clientProject.findMany({
        where: { clientId: client.id },
        select: { projectId: true },
      });
      const projectIds = links.map((l) => l.projectId);
      if (projectIds.length) {
        const assets = await this.prisma.propertyAsset.findMany({
          where: { sourceProjectId: { in: projectIds } },
          select: { id: true, name: true, address: true },
        });
        for (const p of assets) byId.set(p.id, p);
      }
    }

    return [...byId.values()];
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
