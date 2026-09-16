import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DepositSettlementStatus,
  MaintenanceResponsibility,
  NotificationType,
  PaymentStatus,
  RemittanceStatus,
  UserRole,
  WorkOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRemittanceDto, MarkRemittancePaidDto } from './dto/remittance.dto';

const include = {
  property: {
    select: { id: true, name: true, code: true, address: true, landlordName: true },
  },
};

@Injectable()
export class RemittancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.landlordRemittance
      .findMany({
        include,
        orderBy: [{ periodEnd: 'desc' }, { createdAt: 'desc' }],
      })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.landlordRemittance.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Remittance not found');
    return this.serialize(row);
  }

  /**
   * Suggest remittance figures from linked rent payments, deposit shortfalls,
   * and landlord-funded maintenance (does not invent WAITING accounting rules).
   */
  async preview(
    user: AuthUser,
    propertyId: string,
    periodStart: string,
    periodEnd: string,
  ) {
    this.assertCanView(user);
    if (!propertyId || !periodStart || !periodEnd) {
      throw new BadRequestException('propertyId, periodStart and periodEnd are required');
    }
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw new BadRequestException('Invalid period');
    }
    // Inclusive end-of-day for date filters
    const endInclusive = new Date(end);
    endInclusive.setHours(23, 59, 59, 999);

    const property = await this.prisma.propertyAsset.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        address: true,
        landlordName: true,
        tenancies: {
          select: {
            id: true,
            agreementNo: true,
            tenantName: true,
            rentAnnual: true,
            status: true,
            applicationId: true,
          },
        },
      },
    });
    if (!property) throw new NotFoundException('Property not found');

    const applicationIds = property.tenancies
      .map((t) => t.applicationId)
      .filter((id): id is string => !!id);

    const offers = applicationIds.length
      ? await this.prisma.tenancyOffer.findMany({
          where: {
            applicationId: { in: applicationIds },
            landlordInvoiceId: { not: null },
          },
          select: {
            number: true,
            landlordInvoiceId: true,
            applicationId: true,
          },
        })
      : [];

    const landlordInvoiceIds = offers
      .map((o) => o.landlordInvoiceId)
      .filter((id): id is string => !!id);

    const rentPayments =
      landlordInvoiceIds.length === 0
        ? []
        : await this.prisma.payment.findMany({
            where: {
              invoiceId: { in: landlordInvoiceIds },
              status: PaymentStatus.VERIFIED,
              OR: [
                { verifiedAt: { gte: start, lte: endInclusive } },
                {
                  verifiedAt: null,
                  createdAt: { gte: start, lte: endInclusive },
                },
              ],
            },
            include: {
              invoice: { select: { invoiceNumber: true, contractRef: true } },
            },
            orderBy: { createdAt: 'asc' },
          });

    const suggestedGrossRent =
      Math.round(rentPayments.reduce((s, p) => s + Number(p.amount), 0) * 100) / 100;

    const depositSettlements = await this.prisma.depositSettlement.findMany({
      where: {
        tenancy: { propertyId },
        OR: [
          { closedAt: { gte: start, lte: endInclusive } },
          {
            closedAt: null,
            approvedAt: { gte: start, lte: endInclusive },
          },
        ],
      },
      include: {
        tenancy: { select: { tenantName: true, agreementNo: true } },
        shortfallInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            paidTotal: true,
            status: true,
          },
        },
      },
    });

    const shortfallLines = depositSettlements
      .filter((d) => Number(d.shortfallAmount) > 0)
      .map((d) => ({
        number: d.number,
        tenantName: d.tenancy.tenantName,
        shortfallAmount: Number(d.shortfallAmount),
        shortfallPaid: Number(d.shortfallInvoice?.paidTotal ?? 0),
        status: d.status,
      }));

    const suggestedOtherReceipts =
      Math.round(
        shortfallLines.reduce(
          (s, l) => s + (l.shortfallPaid > 0 ? l.shortfallPaid : 0),
          0,
        ) * 100,
      ) / 100;

    const depositRefundNotes = depositSettlements
      .filter(
        (d) =>
          Number(d.refundAmount) > 0 &&
          (d.status === DepositSettlementStatus.REFUND_PAID ||
            d.status === DepositSettlementStatus.CLOSED),
      )
      .map((d) => ({
        number: d.number,
        tenantName: d.tenancy.tenantName,
        refundAmount: Number(d.refundAmount),
        note: 'Tenant refund — not remitted to landlord',
      }));

    const landlordWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        status: {
          in: [
            WorkOrderStatus.CONFIRMED,
            WorkOrderStatus.INVOICED,
            WorkOrderStatus.PAID,
            WorkOrderStatus.CLOSED,
          ],
        },
        completedAt: { gte: start, lte: endInclusive },
        request: {
          propertyId,
          responsibility: MaintenanceResponsibility.LANDLORD,
        },
      },
      include: {
        request: { select: { number: true, description: true } },
      },
    });

    const maintenanceExpenseLines = landlordWorkOrders.map((wo) => {
      const labour = Number(wo.labourAmount ?? 0);
      const materials = Number(wo.materialsAmount ?? 0);
      // Platform fee is company income — not a landlord remittance expense deduction by default
      const amount = Math.round((labour + materials) * 100) / 100;
      return {
        workOrder: wo.number,
        request: wo.request.number,
        description: wo.request.description.slice(0, 120),
        amount,
      };
    });

    const suggestedExpenses =
      Math.round(maintenanceExpenseLines.reduce((s, l) => s + l.amount, 0) * 100) / 100;

    const expenseNoteParts: string[] = [];
    if (maintenanceExpenseLines.length) {
      expenseNoteParts.push(
        `Landlord maintenance: ${maintenanceExpenseLines
          .map((l) => `${l.workOrder} NGN ${l.amount.toLocaleString()}`)
          .join('; ')}`,
      );
    }
    if (depositRefundNotes.length) {
      expenseNoteParts.push(
        `Deposit refunds (tenant, excluded from net): ${depositRefundNotes
          .map((r) => `${r.number} NGN ${r.refundAmount.toLocaleString()}`)
          .join('; ')}`,
      );
    }

    const suggestedNet =
      Math.round((suggestedGrossRent + suggestedOtherReceipts - suggestedExpenses) * 100) /
      100;

    return {
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        landlordName: property.landlordName,
      },
      periodStart,
      periodEnd,
      suggestedGrossRent,
      suggestedOtherReceipts,
      suggestedExpenses,
      suggestedNet,
      expenseNotesSuggested: expenseNoteParts.join('\n') || null,
      breakdown: {
        rentPayments: rentPayments.map((p) => ({
          amount: Number(p.amount),
          invoiceNumber: p.invoice.invoiceNumber,
          contractRef: p.invoice.contractRef,
          verifiedAt: p.verifiedAt,
        })),
        depositShortfalls: shortfallLines,
        depositRefunds: depositRefundNotes,
        landlordMaintenance: maintenanceExpenseLines,
        tenancies: property.tenancies.map((t) => ({
          id: t.id,
          tenantName: t.tenantName,
          agreementNo: t.agreementNo,
          rentAnnual: Number(t.rentAnnual),
          status: t.status,
        })),
      },
      note:
        'Suggestions only — exact remittance accounting remains WAITING client confirmation. Tenant deposit refunds are excluded from landlord net.',
    };
  }

  async create(dto: CreateRemittanceDto, user: AuthUser) {
    this.assertCanManage(user);
    const property = await this.prisma.propertyAsset.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const other = dto.otherReceipts ?? 0;
    const expenses = dto.expensesTotal ?? 0;
    const gross = dto.grossRent + other;
    const net = Math.round((gross - expenses) * 100) / 100;
    if (net < 0) {
      throw new BadRequestException('Net remittance cannot be negative');
    }

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const stamp = Date.now().toString(36).toUpperCase().slice(-4);

    const row = await this.prisma.landlordRemittance.create({
      data: {
        number: `REM-${year}${month}-${stamp}`,
        propertyId: dto.propertyId,
        landlordName: dto.landlordName || property.landlordName || 'Landlord',
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        grossRent: dto.grossRent,
        otherReceipts: other,
        expensesTotal: expenses,
        netAmount: net,
        expenseNotes: dto.expenseNotes,
        bankAccount: dto.bankAccount,
        status: RemittanceStatus.DRAFT,
      },
      include,
    });

    const recipients = (await this.notifications.financeUserIds()).filter((id) => id !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.LANDLORD_REMITTANCE,
        title: `Remittance draft — ${row.number}`,
        body: `${row.landlordName} · ${property.name} · net NGN ${Number(row.netAmount).toLocaleString()}`,
        linkUrl: '/remittances',
      });
    }

    return this.serialize(row);
  }

  async approve(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== RemittanceStatus.DRAFT) {
      throw new BadRequestException('Only draft remittances can be approved');
    }
    const row = await this.prisma.landlordRemittance.update({
      where: { id },
      data: { status: RemittanceStatus.APPROVED },
      include,
    });

    const recipients = (await this.notifications.financeUserIds()).filter((id) => id !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.LANDLORD_REMITTANCE,
        title: `Remittance approved — ${row.number}`,
        body: `${row.landlordName} · net NGN ${Number(row.netAmount).toLocaleString()}`,
        linkUrl: '/remittances',
      });
    }

    return this.serialize(row);
  }

  async markPaid(id: string, dto: MarkRemittancePaidDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (
      existing.status !== RemittanceStatus.APPROVED &&
      existing.status !== RemittanceStatus.DRAFT
    ) {
      throw new BadRequestException('Remittance already paid or invalid status');
    }
    const row = await this.prisma.landlordRemittance.update({
      where: { id },
      data: {
        status: RemittanceStatus.PAID,
        transferRef: dto.transferRef,
        bankAccount: dto.bankAccount ?? existing.bankAccount,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      },
      include,
    });

    const recipients = [
      ...(await this.notifications.financeUserIds()),
      ...(await this.notifications.pmUserIds()),
    ].filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.LANDLORD_REMITTANCE,
        title: `Remittance paid — ${row.number}`,
        body: `${row.landlordName} · NGN ${Number(row.netAmount).toLocaleString()}${dto.transferRef ? ` · ref ${dto.transferRef}` : ''}`,
        linkUrl: '/remittances',
      });
    }

    return this.serialize(row);
  }

  async buildPdf(id: string, user: AuthUser) {
    const row = await this.findOne(id, user);
    const { buildRemittancePdf } = await import('./remittance.pdf');
    return buildRemittancePdf({
      number: row.number as string,
      propertyName: (row.property as { name: string }).name,
      propertyAddress: (row.property as { address: string }).address,
      landlordName: row.landlordName as string,
      periodStart: new Date(row.periodStart as string | Date),
      periodEnd: new Date(row.periodEnd as string | Date),
      grossRent: Number(row.grossRent),
      otherReceipts: Number(row.otherReceipts),
      expensesTotal: Number(row.expensesTotal),
      netAmount: Number(row.netAmount),
      expenseNotes: (row.expenseNotes as string | null) ?? null,
      bankAccount: (row.bankAccount as string | null) ?? null,
      transferRef: (row.transferRef as string | null) ?? null,
      paidAt: row.paidAt ? new Date(row.paidAt as string | Date) : null,
      status: row.status as string,
      issuedAt: new Date(row.createdAt as string | Date),
    });
  }

  private serialize<T extends Record<string, unknown>>(row: T) {
    const r = row as T & {
      grossRent: unknown;
      otherReceipts: unknown;
      expensesTotal: unknown;
      netAmount: unknown;
    };
    return {
      ...r,
      grossRent: Number(r.grossRent),
      otherReceipts: Number(r.otherReceipts),
      expensesTotal: Number(r.expensesTotal),
      netAmount: Number(r.netAmount),
    };
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    this.assertCanView(user);
  }
}
