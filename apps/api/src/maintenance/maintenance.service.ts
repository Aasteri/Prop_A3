import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateMaintenanceDto,
  CreateWorkOrderDto,
  ListMaintenanceQueryDto,
  UpdateMaintenanceDto,
  UpdateWorkOrderDto,
} from './dto/maintenance.dto';

const include = {
  property: { select: { id: true, name: true, code: true, address: true } },
  workOrders: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, query: ListMaintenanceQueryDto) {
    this.assertCanView(user);
    return this.prisma.maintenanceRequest.findMany({
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
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include,
    });
    if (!row) throw new NotFoundException('Maintenance request not found');
    return row;
  }

  async create(dto: CreateMaintenanceDto, user: AuthUser) {
    this.assertCanManage(user);
    const property = await this.prisma.propertyAsset.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const number = await this.nextNumber('MR');
    return this.prisma.maintenanceRequest.create({
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
  }

  async update(id: string, dto: UpdateMaintenanceDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.maintenanceRequest.update({
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
  }

  async createWorkOrder(requestId: string, dto: CreateWorkOrderDto, user: AuthUser) {
    this.assertCanManage(user);
    const request = await this.findOne(requestId, user);
    const number = await this.nextNumber('WO');
    const labour = dto.labourAmount ?? 0;
    const materials = dto.materialsAmount ?? 0;
    const platformFee =
      dto.platformFee ?? Math.round((labour + materials) * 0.1 * 100) / 100;

    const [wo] = await this.prisma.$transaction([
      this.prisma.workOrder.create({
        data: {
          number,
          requestId,
          artisanName: dto.artisanName,
          artisanPhone: dto.artisanPhone,
          labourAmount: dto.labourAmount,
          materialsAmount: dto.materialsAmount,
          platformFee,
          withinServiceCharge: dto.withinServiceCharge ?? true,
          status: 'ASSIGNED',
        },
      }),
      this.prisma.maintenanceRequest.update({
        where: { id: request.id },
        data: { status: 'ASSIGNED' },
      }),
    ]);

    return wo;
  }

  async updateWorkOrder(id: string, dto: UpdateWorkOrderDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Work order not found');

    return this.prisma.workOrder.update({
      where: { id },
      data: {
        status: dto.status,
        artisanName: dto.artisanName,
        artisanPhone: dto.artisanPhone,
        tenantSatisfied: dto.tenantSatisfied,
        tenantRating: dto.tenantRating,
        tenantFeedback: dto.tenantFeedback,
        completedAt:
          dto.status === 'COMPLETED_PENDING_CONFIRM' || dto.status === 'CONFIRMED'
            ? new Date()
            : undefined,
      },
    });
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
