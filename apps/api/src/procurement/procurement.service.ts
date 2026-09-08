import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PurchaseOrderStatus, PurchaseRequisitionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  CreatePurchaseRequisitionDto,
  CreateSupplierDto,
  ListProcurementQueryDto,
} from './dto/procurement.dto';

const poInclude = {
  supplier: true,
  pr: { select: { id: true, number: true, status: true } },
  lines: true,
  receipts: { include: { lines: true } },
};

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
        ...(query.status ? { status: query.status as never } : {}),
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
        status: PurchaseRequisitionStatus.SUBMITTED,
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
      data: { status: PurchaseRequisitionStatus.APPROVED },
      include: { lines: true },
    });
  }

  listOrders(user: AuthUser, query: ListProcurementQueryDto) {
    this.assertCanView(user);
    return this.prisma.purchaseOrder.findMany({
      where: {
        ...(query.status ? { status: query.status as never } : {}),
        ...(query.search
          ? {
              OR: [
                { number: { contains: query.search } },
                { destination: { contains: query.search } },
              ],
            }
          : {}),
      },
      include: poInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(dto: CreatePurchaseOrderDto, user: AuthUser) {
    this.assertCanManage(user);
    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    let lines = dto.lines ?? [];
    if (dto.prId) {
      const pr = await this.prisma.purchaseRequisition.findUnique({
        where: { id: dto.prId },
        include: { lines: true },
      });
      if (!pr) throw new NotFoundException('Purchase requisition not found');
      if (
        pr.status !== PurchaseRequisitionStatus.APPROVED &&
        pr.status !== PurchaseRequisitionStatus.CONVERTED_TO_PO
      ) {
        throw new BadRequestException('PR must be approved before converting to PO');
      }
      if (!lines.length) {
        lines = pr.lines.map((l) => ({
          description: l.description,
          spec: l.spec ?? undefined,
          unit: l.unit ?? undefined,
          qty: Number(l.qty),
          unitPrice: Number(l.estUnitCost ?? 0),
        }));
      }
    }
    if (!lines.length) {
      throw new BadRequestException('PO needs at least one line');
    }

    const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          number: `PO-${year}-${stamp}`,
          supplierId: dto.supplierId,
          prId: dto.prId,
          destination: dto.destination,
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : undefined,
          paymentBeforeDelivery: dto.paymentBeforeDelivery ?? true,
          totalAmount: Math.round(total * 100) / 100,
          status: PurchaseOrderStatus.APPROVED,
          lines: {
            create: lines.map((l) => ({
              description: l.description,
              spec: l.spec,
              unit: l.unit,
              qty: l.qty,
              unitPrice: l.unitPrice,
            })),
          },
        },
        include: poInclude,
      });

      if (dto.prId) {
        await tx.purchaseRequisition.update({
          where: { id: dto.prId },
          data: { status: PurchaseRequisitionStatus.CONVERTED_TO_PO },
        });
      }

      return po;
    });
  }

  async createReceipt(dto: CreateGoodsReceiptDto, user: AuthUser) {
    this.assertCanManage(user);
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: dto.poId },
      include: { lines: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (
      po.status === PurchaseOrderStatus.CANCELLED ||
      po.status === PurchaseOrderStatus.CLOSED
    ) {
      throw new BadRequestException('Cannot receive against a closed/cancelled PO');
    }

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const stamp = Date.now().toString(36).toUpperCase().slice(-4);

    const allAccepted = dto.lines.every(
      (l) => l.qtyAccepted + (l.qtyRejected ?? 0) >= l.qtyOrdered - 0.0001,
    );

    return this.prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceipt.create({
        data: {
          number: `GRN-${year}${month}-${stamp}`,
          poId: dto.poId,
          supplierInvoiceNo: dto.supplierInvoiceNo,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
          notes: dto.notes,
          lines: {
            create: dto.lines.map((l) => ({
              description: l.description,
              qtyOrdered: l.qtyOrdered,
              qtyReceived: l.qtyReceived,
              qtyAccepted: l.qtyAccepted,
              qtyRejected: l.qtyRejected ?? 0,
              notes: l.notes,
            })),
          },
        },
        include: { lines: true, po: { include: { supplier: true } } },
      });

      await tx.purchaseOrder.update({
        where: { id: dto.poId },
        data: {
          status: allAccepted
            ? PurchaseOrderStatus.CLOSED
            : PurchaseOrderStatus.PARTIALLY_RECEIVED,
        },
      });

      return grn;
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
      UserRole.STORE_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only PM, Finance, Store, or Admin can manage procurement');
    }
  }
}
