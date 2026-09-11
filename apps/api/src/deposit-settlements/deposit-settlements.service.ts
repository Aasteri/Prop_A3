import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DepositSettlementStatus,
  InventoryKind,
  InventoryStatus,
  InvoiceType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  compareInventoryRooms,
  DepositCompareLine,
  sumChargeableDeductions,
} from '../inventories/inventory-rooms.constants';
import { generateInvoiceNumber } from '../invoices/invoices.utils';
import {
  CreateDepositSettlementDto,
  DepositSettlementLineDto,
  UpdateDepositSettlementDto,
} from './dto/deposit-settlement.dto';

const include = {
  tenancy: {
    select: {
      id: true,
      tenantName: true,
      agreementNo: true,
      cautionAmount: true,
      status: true,
      property: { select: { id: true, name: true, address: true } },
      unit: { select: { unitCode: true } },
    },
  },
  moveInInventory: { select: { id: true, number: true, status: true, kind: true } },
  moveOutInventory: { select: { id: true, number: true, status: true, kind: true } },
  shortfallInvoice: {
    select: { id: true, invoiceNumber: true, status: true, outstanding: true },
  },
};

@Injectable()
export class DepositSettlementsService {
  constructor(private readonly prisma: PrismaService) {}

  findByTenancy(tenancyId: string, user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.depositSettlement.findMany({
      where: { tenancyId },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.depositSettlement.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Deposit settlement not found');
    return row;
  }

  async preview(tenancyId: string, user: AuthUser, moveOutInventoryId?: string) {
    this.assertCanView(user);
    const { tenancy, moveIn, moveOut } = await this.resolvePair(tenancyId, moveOutInventoryId);
    const lines = compareInventoryRooms(moveIn.roomsJson, moveOut.roomsJson);
    const totalDeductions = sumChargeableDeductions(lines);
    const cautionHeld = Number(tenancy.cautionAmount ?? 0);
    const refundAmount = Math.max(0, Math.round((cautionHeld - totalDeductions) * 100) / 100);
    const shortfallAmount = Math.max(0, Math.round((totalDeductions - cautionHeld) * 100) / 100);

    return {
      tenancy: {
        id: tenancy.id,
        tenantName: tenancy.tenantName,
        cautionAmount: cautionHeld,
        status: tenancy.status,
        property: tenancy.property,
        unit: tenancy.unit,
      },
      moveInInventory: { id: moveIn.id, number: moveIn.number },
      moveOutInventory: { id: moveOut.id, number: moveOut.number },
      lines,
      cautionHeld,
      totalDeductions,
      refundAmount,
      shortfallAmount,
    };
  }

  async create(dto: CreateDepositSettlementDto, user: AuthUser) {
    this.assertCanManage(user);
    const { tenancy, moveIn, moveOut } = await this.resolvePair(
      dto.tenancyId,
      dto.moveOutInventoryId,
    );

    const existing = await this.prisma.depositSettlement.findFirst({
      where: {
        tenancyId: tenancy.id,
        moveOutInventoryId: moveOut.id,
        status: { not: DepositSettlementStatus.CLOSED },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Open settlement ${existing.number} already exists for this move-out`,
      );
    }

    const lines: DepositCompareLine[] =
      dto.lines?.map((l) => this.normalizeLine(l)) ??
      compareInventoryRooms(moveIn.roomsJson, moveOut.roomsJson);
    const totals = this.calcTotals(Number(tenancy.cautionAmount ?? 0), lines);
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

    return this.prisma.depositSettlement.create({
      data: {
        number: `DEP-${year}-${stamp}`,
        tenancyId: tenancy.id,
        moveInInventoryId: moveIn.id,
        moveOutInventoryId: moveOut.id,
        cautionHeld: totals.cautionHeld,
        totalDeductions: totals.totalDeductions,
        refundAmount: totals.refundAmount,
        shortfallAmount: totals.shortfallAmount,
        linesJson: lines as never,
        notes: dto.notes,
        status: DepositSettlementStatus.DRAFT,
      },
      include,
    });
  }

  async update(id: string, dto: UpdateDepositSettlementDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== DepositSettlementStatus.DRAFT) {
      throw new BadRequestException('Only draft settlements can be edited');
    }
    const lines = dto.lines?.map((l) => this.normalizeLine(l)) ??
      (existing.linesJson as DepositCompareLine[]);
    const totals = this.calcTotals(Number(existing.cautionHeld), lines);
    return this.prisma.depositSettlement.update({
      where: { id },
      data: {
        linesJson: lines as never,
        totalDeductions: totals.totalDeductions,
        refundAmount: totals.refundAmount,
        shortfallAmount: totals.shortfallAmount,
        notes: dto.notes,
      },
      include,
    });
  }

  async approve(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== DepositSettlementStatus.DRAFT) {
      throw new BadRequestException('Only draft settlements can be approved');
    }
    const nextStatus =
      Number(existing.refundAmount) > 0
        ? DepositSettlementStatus.REFUND_PENDING
        : DepositSettlementStatus.APPROVED;
    return this.prisma.depositSettlement.update({
      where: { id },
      data: {
        status: nextStatus,
        approvedAt: new Date(),
      },
      include,
    });
  }

  async createShortfallInvoice(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const settlement = await this.findOne(id, user);
    if (
      settlement.status !== DepositSettlementStatus.APPROVED &&
      settlement.status !== DepositSettlementStatus.REFUND_PENDING &&
      settlement.status !== DepositSettlementStatus.REFUND_PAID
    ) {
      throw new BadRequestException('Approve settlement before creating shortfall invoice');
    }
    if (Number(settlement.shortfallAmount) <= 0) {
      throw new BadRequestException('No shortfall to invoice');
    }
    if (settlement.shortfallInvoiceId) {
      throw new BadRequestException('Shortfall invoice already linked');
    }

    const settlementEntity = await this.prisma.settlementEntity.findFirst({
      where: { isDefault: true },
    });
    if (!settlementEntity) {
      throw new BadRequestException('No default settlement entity configured');
    }

    const lines = (settlement.linesJson as DepositCompareLine[]).filter(
      (l) => l.chargeable && !l.wearAndTear && Number(l.cost) > 0,
    );
    const year = new Date().getFullYear();

    await this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await generateInvoiceNumber(tx, InvoiceType.RENTAL, year);
      const shortfall = Number(settlement.shortfallAmount);
      const inv = await tx.invoice.create({
        data: {
          settlementEntityId: settlementEntity.id,
          invoiceNumber,
          invoiceType: InvoiceType.RENTAL,
          issueDate: new Date(),
          contractRef: settlement.tenancy.agreementNo ?? settlement.number,
          clientName: settlement.tenancy.tenantName,
          clientAddress: settlement.tenancy.property.address,
          projectDetails: `Caution shortfall · ${settlement.tenancy.property.name}`,
          paymentTerms: 'Due on receipt — tenant-caused damage exceeding caution deposit (G.14)',
          baseTotal: shortfall,
          revisedTotal: shortfall,
          outstanding: shortfall,
          createdById: user.id,
          lines: {
            create: (lines.length
              ? lines
              : [
                  {
                    section: 'Settlement',
                    item: 'Caution shortfall',
                    cost: shortfall,
                  },
                ]
            ).map((l, i) => ({
              description: `${l.section} · ${l.item}`,
              quantity: 1,
              unit: 'lot',
              unitPrice: Number(l.cost),
              totalAmount: Number(l.cost),
              sortOrder: i,
            })),
          },
        },
      });

      await tx.depositSettlement.update({
        where: { id },
        data: { shortfallInvoiceId: inv.id },
      });
    });

    return this.findOne(id, user);
  }

  async markRefundPaid(
    id: string,
    dto: { refundReference?: string },
    user: AuthUser,
  ) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== DepositSettlementStatus.REFUND_PENDING) {
      throw new BadRequestException('Settlement is not awaiting refund');
    }
    if (Number(existing.refundAmount) <= 0) {
      throw new BadRequestException('No refund amount to mark paid');
    }
    return this.prisma.depositSettlement.update({
      where: { id },
      data: {
        status: DepositSettlementStatus.REFUND_PAID,
        refundPaidAt: new Date(),
        refundReference: dto.refundReference,
      },
      include,
    });
  }

  async buildPdf(id: string, user: AuthUser) {
    const settlement = await this.findOne(id, user);
    const lines = (settlement.linesJson as DepositCompareLine[]) ?? [];
    const { buildDepositSettlementPdf } = await import('./deposit-settlement.pdf');
    return buildDepositSettlementPdf({
      number: settlement.number,
      tenantName: settlement.tenancy.tenantName,
      propertyLabel: `${settlement.tenancy.property.name}${
        settlement.tenancy.unit ? ` · ${settlement.tenancy.unit.unitCode}` : ''
      }`,
      cautionHeld: Number(settlement.cautionHeld),
      totalDeductions: Number(settlement.totalDeductions),
      refundAmount: Number(settlement.refundAmount),
      shortfallAmount: Number(settlement.shortfallAmount),
      status: settlement.status,
      moveInNumber: settlement.moveInInventory.number,
      moveOutNumber: settlement.moveOutInventory.number,
      lines: lines.map((l) => ({
        section: l.section,
        item: l.item,
        moveInDefects: l.moveInDefects,
        moveOutDefects: l.moveOutDefects,
        cost: Number(l.cost) || 0,
        wearAndTear: !!l.wearAndTear,
        chargeable: !!l.chargeable,
      })),
      refundPaidAt: settlement.refundPaidAt,
      refundReference: settlement.refundReference,
      shortfallInvoiceNumber: settlement.shortfallInvoice?.invoiceNumber ?? null,
      issuedAt: settlement.approvedAt ?? settlement.createdAt,
    });
  }

  async close(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (
      existing.status !== DepositSettlementStatus.APPROVED &&
      existing.status !== DepositSettlementStatus.REFUND_PENDING &&
      existing.status !== DepositSettlementStatus.REFUND_PAID
    ) {
      throw new BadRequestException('Approve settlement before close');
    }
    if (Number(existing.shortfallAmount) > 0 && !existing.shortfallInvoiceId) {
      throw new BadRequestException(
        'Create shortfall invoice before closing, or set deductions to zero',
      );
    }
    if (Number(existing.refundAmount) > 0 && !existing.refundPaidAt) {
      throw new BadRequestException(
        'Mark caution refund as paid before closing (or set refund to zero)',
      );
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.tenancy.update({
        where: { id: existing.tenancyId },
        data: { status: 'TERMINATED' },
      }),
      this.prisma.depositSettlement.update({
        where: { id },
        data: {
          status: DepositSettlementStatus.CLOSED,
          closedAt: new Date(),
        },
        include,
      }),
    ]);
    return updated;
  }

  private async resolvePair(tenancyId: string, moveOutInventoryId?: string) {
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: {
        property: { select: { id: true, name: true, address: true } },
        unit: { select: { unitCode: true } },
        inventories: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!tenancy) throw new NotFoundException('Tenancy not found');

    const moveIn = tenancy.inventories.find(
      (i) => i.kind === InventoryKind.MOVE_IN && i.status === InventoryStatus.COMPLETED,
    );
    if (!moveIn) {
      throw new BadRequestException('Completed move-in inventory required as baseline');
    }

    const moveOut = moveOutInventoryId
      ? tenancy.inventories.find((i) => i.id === moveOutInventoryId)
      : tenancy.inventories.find(
          (i) => i.kind === InventoryKind.MOVE_OUT && i.status === InventoryStatus.COMPLETED,
        ) ?? tenancy.inventories.find((i) => i.kind === InventoryKind.MOVE_OUT);

    if (!moveOut || moveOut.kind !== InventoryKind.MOVE_OUT) {
      throw new BadRequestException('Move-out inventory required');
    }
    if (moveOut.status !== InventoryStatus.COMPLETED) {
      throw new BadRequestException('Complete and sign move-out inventory before settlement');
    }

    return { tenancy, moveIn, moveOut };
  }

  private normalizeLine(l: DepositSettlementLineDto): DepositCompareLine {
    return {
      sectionId: l.sectionId,
      section: l.section,
      itemId: l.itemId,
      item: l.item,
      moveInDefects: l.moveInDefects ?? '',
      moveOutDefects: l.moveOutDefects ?? '',
      comments: l.comments ?? '',
      cost: Number(l.cost) || 0,
      wearAndTear: !!l.wearAndTear,
      chargeable: !!l.chargeable,
    };
  }

  private calcTotals(cautionHeld: number, lines: DepositCompareLine[]) {
    const totalDeductions = sumChargeableDeductions(lines);
    return {
      cautionHeld,
      totalDeductions,
      refundAmount: Math.max(0, Math.round((cautionHeld - totalDeductions) * 100) / 100),
      shortfallAmount: Math.max(0, Math.round((totalDeductions - cautionHeld) * 100) / 100),
    };
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.SALES,
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
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
