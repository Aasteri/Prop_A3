import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreatePurchaseRequisitionDto,
  CreateSupplierDto,
  ListProcurementQueryDto,
} from './dto/procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(private readonly prisma: PrismaService) {}

  listSuppliers(user: AuthUser, query: ListProcurementQueryDto) {
    this.assertCanView(user);
    return this.prisma.supplier.findMany({
      where: query.search
        ? {
            OR: [
              { legalName: { contains: query.search } },
              { tradingName: { contains: query.search } },
              { phone: { contains: query.search } },
            ],
          }
        : undefined,
      orderBy: { legalName: 'asc' },
    });
  }

  createSupplier(dto: CreateSupplierDto, user: AuthUser) {
    this.assertCanManage(user);
    return this.prisma.supplier.create({
      data: {
        legalName: dto.legalName,
        tradingName: dto.tradingName,
        cacNumber: dto.cacNumber,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        status: 'active',
      },
    });
  }

  listRequisitions(user: AuthUser, query: ListProcurementQueryDto) {
    this.assertCanView(user);
    return this.prisma.purchaseRequisition.findMany({
      where: {
        ...(query.status
          ? { status: query.status as never }
          : {}),
        ...(query.search
          ? {
              OR: [
                { number: { contains: query.search } },
                { justification: { contains: query.search } },
              ],
            }
          : {}),
      },
      include: { lines: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequisition(dto: CreatePurchaseRequisitionDto, user: AuthUser) {
    this.assertCanManage(user);
    if (!dto.lines?.length) {
      throw new BadRequestException('At least one line is required');
    }
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    return this.prisma.purchaseRequisition.create({
      data: {
        number: `PR-${year}-${stamp}`,
        projectId: dto.projectId,
        propertyId: dto.propertyId,
        neededBy: dto.neededBy ? new Date(dto.neededBy) : undefined,
        justification: dto.justification,
        status: 'SUBMITTED',
        lines: {
          create: dto.lines.map((l) => ({
            description: l.description,
            spec: l.spec,
            unit: l.unit,
            qty: l.qty,
            estUnitCost: l.estUnitCost,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async approveRequisition(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const pr = await this.prisma.purchaseRequisition.findUnique({ where: { id } });
    if (!pr) throw new NotFoundException('Purchase requisition not found');
    return this.prisma.purchaseRequisition.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: { lines: true },
    });
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.FOREMAN,
      UserRole.STORE_MANAGER,
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
      throw new ForbiddenException('Only PM, Finance, or Admin can manage procurement');
    }
  }
}
