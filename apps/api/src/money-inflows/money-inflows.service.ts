import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EarnerType,
  InvoiceType,
  MoneyChannel,
  MoneyInflowStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { PatchAttributionsDto } from './dto/money-inflow.dto';

const include = {
  invoice: {
    select: {
      id: true,
      invoiceNumber: true,
      invoiceType: true,
      clientName: true,
      revisedTotal: true,
    },
  },
  payment: { select: { id: true, amount: true, receiptNumber: true, status: true } },
  attributions: {
    include: {
      earnerUser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
} as const;

type AttributionDraft = {
  earnerType: EarnerType;
  earnerName?: string;
  earnerRef?: string;
  sharePct?: number;
  amount: number;
  category?: string;
  notes?: string;
};

@Injectable()
export class MoneyInflowsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.moneyInflow.findMany({
      include,
      orderBy: { receivedAt: 'desc' },
      take: 200,
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.moneyInflow.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Money inflow not found');
    return row;
  }

  async patchAttributions(id: string, dto: PatchAttributionsDto, user: AuthUser) {
    this.assertCanAdjust(user);
    const inflow = await this.findOne(id, user);
    if (inflow.status === MoneyInflowStatus.REVERSED) {
      throw new BadRequestException('Cannot adjust a reversed inflow');
    }

    const total = dto.attributions.reduce((s, a) => s + a.amount, 0);
    const gross = Number(inflow.grossAmount);
    if (Math.abs(total - gross) > 0.05) {
      throw new BadRequestException(
        `Attribution total ₦${total.toLocaleString()} must match gross ₦${gross.toLocaleString()}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.moneyAttribution.deleteMany({ where: { inflowId: id } });
      await tx.moneyAttribution.createMany({
        data: dto.attributions.map((a) => ({
          inflowId: id,
          earnerType: a.earnerType,
          earnerUserId: a.earnerUserId,
          earnerName: a.earnerName,
          earnerRef: a.earnerRef,
          sharePct: a.sharePct,
          amount: a.amount,
          category: a.category,
          notes: a.notes,
        })),
      });
      await tx.moneyInflow.update({
        where: { id },
        data: {
          status: MoneyInflowStatus.ALLOCATED,
          notes: dto.notes ?? inflow.notes,
        },
      });
    });

    return this.findOne(id, user);
  }

  /**
   * Called after a payment is verified — creates BANK_TRANSFER (or given) inflow + auto attributions.
   */
  async createFromVerifiedPayment(
    tx: Prisma.TransactionClient,
    opts: {
      paymentId: string;
      invoiceId: string;
      amount: number;
      clientName: string;
      invoiceType: InvoiceType;
      channel?: MoneyChannel;
      payerReference?: string;
    },
  ) {
    const existing = await tx.moneyInflow.findUnique({ where: { paymentId: opts.paymentId } });
    if (existing) return existing;

    const number = await this.generateInflowNumber(tx);
    const attributions = await this.buildAutoAttributions(tx, opts);

    const status =
      attributions.length > 0 ? MoneyInflowStatus.ALLOCATED : MoneyInflowStatus.RECEIVED;

    return tx.moneyInflow.create({
      data: {
        number,
        paymentId: opts.paymentId,
        invoiceId: opts.invoiceId,
        channel: opts.channel ?? MoneyChannel.BANK_TRANSFER,
        grossAmount: opts.amount,
        receivedAt: new Date(),
        payerName: opts.clientName,
        payerReference: opts.payerReference,
        status,
        notes: 'Auto-created on payment verify',
        attributions: {
          create: attributions.map((a) => ({
            earnerType: a.earnerType,
            earnerName: a.earnerName,
            earnerRef: a.earnerRef,
            sharePct: a.sharePct,
            amount: a.amount,
            category: a.category,
            notes: a.notes,
          })),
        },
      },
      include: { attributions: true },
    });
  }

  async createPaystackInflow(opts: {
    amount: number;
    paystackRef: string;
    payerName?: string;
    payerReference?: string;
    invoiceId?: string;
    notes?: string;
  }) {
    const existing = await this.prisma.moneyInflow.findFirst({
      where: { paystackRef: opts.paystackRef },
    });
    if (existing) return existing;

    const number = await this.generateInflowNumber(this.prisma);
    return this.prisma.moneyInflow.create({
      data: {
        number,
        invoiceId: opts.invoiceId,
        channel: MoneyChannel.PAYSTACK,
        grossAmount: opts.amount,
        receivedAt: new Date(),
        payerName: opts.payerName,
        payerReference: opts.payerReference,
        paystackRef: opts.paystackRef,
        status: MoneyInflowStatus.RECEIVED,
        notes: opts.notes ?? 'Paystack webhook (stub — attribution pending Finance)',
        attributions: {
          create: [
            {
              earnerType: EarnerType.COMPANY,
              earnerName: 'Triple A Realty Projects Ltd',
              amount: opts.amount,
              category: 'OTHER',
              notes: 'Placeholder until invoice-linked split',
            },
          ],
        },
      },
      include: { attributions: true },
    });
  }

  private async buildAutoAttributions(
    tx: Prisma.TransactionClient,
    opts: {
      invoiceId: string;
      amount: number;
      invoiceType: InvoiceType;
      clientName: string;
    },
  ): Promise<AttributionDraft[]> {
    const amount = opts.amount;

    const asLandlord = await tx.tenancyOffer.findFirst({
      where: { landlordInvoiceId: opts.invoiceId },
      select: {
        landlordPayee: true,
        rentAnnual: true,
        cautionAmount: true,
        serviceChargeAnnual: true,
        estateServiceCharge: true,
      },
    });
    if (asLandlord) {
      const rent = Number(asLandlord.rentAnnual);
      const caution = Number(asLandlord.cautionAmount);
      const sc = Number(asLandlord.serviceChargeAnnual) + Number(asLandlord.estateServiceCharge);
      const expected = rent + caution + sc;
      const scale = expected > 0 ? amount / expected : 1;
      const drafts: AttributionDraft[] = [
        {
          earnerType: EarnerType.LANDLORD,
          earnerName: asLandlord.landlordPayee ?? 'Landlord',
          amount: Math.round(rent * scale * 100) / 100,
          category: 'RENT_TO_LANDLORD',
        },
      ];
      if (caution > 0) {
        drafts.push({
          earnerType: EarnerType.LANDLORD,
          earnerName: asLandlord.landlordPayee ?? 'Landlord',
          amount: Math.round(caution * scale * 100) / 100,
          category: 'OTHER',
          notes: 'Caution / security deposit',
        });
      }
      if (sc > 0) {
        drafts.push({
          earnerType: EarnerType.COMPANY,
          earnerName: 'Triple A Realty Projects Ltd',
          amount: Math.round(sc * scale * 100) / 100,
          category: 'SERVICE_CHARGE',
        });
      }
      return this.normalizeToGross(drafts, amount);
    }

    const asManagement = await tx.tenancyOffer.findFirst({
      where: { managementInvoiceId: opts.invoiceId },
      select: {
        managementPayee: true,
        managementFeeAmount: true,
        legalFeeAmount: true,
      },
    });
    if (asManagement) {
      const mgmt = Number(asManagement.managementFeeAmount);
      const legal = Number(asManagement.legalFeeAmount);
      const expected = mgmt + legal;
      const scale = expected > 0 ? amount / expected : 1;
      return this.normalizeToGross(
        [
          {
            earnerType: EarnerType.COMPANY,
            earnerName: asManagement.managementPayee ?? 'Triple A Realty Projects Ltd',
            amount: Math.round(mgmt * scale * 100) / 100,
            category: 'MANAGEMENT_FEE',
          },
          {
            earnerType: EarnerType.COMPANY,
            earnerName: asManagement.managementPayee ?? 'Triple A Realty Projects Ltd',
            amount: Math.round(legal * scale * 100) / 100,
            category: 'OTHER',
            notes: 'Legal fee',
          },
        ],
        amount,
      );
    }

    const asAgency = await tx.tenancyOffer.findFirst({
      where: { agencyInvoiceId: opts.invoiceId },
      select: { agencyPayee: true },
    });
    if (asAgency || opts.invoiceType === InvoiceType.AGENCY) {
      return [
        {
          earnerType: EarnerType.COMPANY,
          earnerName: asAgency?.agencyPayee ?? 'Triple A Realty Projects Ltd',
          amount,
          category: 'AGENCY_FEE',
        },
      ];
    }

    if (opts.invoiceType === InvoiceType.RENTAL) {
      return [
        {
          earnerType: EarnerType.LANDLORD,
          earnerName: opts.clientName,
          amount,
          category: 'RENT_TO_LANDLORD',
        },
      ];
    }

    if (opts.invoiceType === InvoiceType.SERVICE) {
      return [
        {
          earnerType: EarnerType.COMPANY,
          earnerName: 'Triple A Realty Projects Ltd',
          amount,
          category: 'MANAGEMENT_FEE',
        },
      ];
    }

    if (opts.invoiceType === InvoiceType.SALES || opts.invoiceType === InvoiceType.VARIATION) {
      return [
        {
          earnerType: EarnerType.COMPANY,
          earnerName: 'Triple A Realty Projects Ltd',
          amount,
          category: opts.invoiceType === InvoiceType.SALES ? 'COMMISSION' : 'WORKS_FEE',
        },
      ];
    }

    return [
      {
        earnerType: EarnerType.COMPANY,
        earnerName: 'Triple A Realty Projects Ltd',
        amount,
        category: 'OTHER',
      },
    ];
  }

  private normalizeToGross(drafts: AttributionDraft[], gross: number): AttributionDraft[] {
    const filtered = drafts.filter((d) => d.amount > 0);
    if (!filtered.length) {
      return [{ earnerType: EarnerType.COMPANY, amount: gross, category: 'OTHER' }];
    }
    const sum = filtered.reduce((s, d) => s + d.amount, 0);
    const diff = Math.round((gross - sum) * 100) / 100;
    if (Math.abs(diff) >= 0.01) {
      filtered[filtered.length - 1].amount =
        Math.round((filtered[filtered.length - 1].amount + diff) * 100) / 100;
    }
    return filtered;
  }

  private async generateInflowNumber(tx: Prisma.TransactionClient | PrismaService): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INFLOW/${year}/`;
    const latest = await tx.moneyInflow.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    let seq = 1;
    if (latest) {
      const parsed = parseInt(latest.number.slice(prefix.length), 10);
      if (!Number.isNaN(parsed)) seq = parsed + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private assertCanView(user: AuthUser) {
    if (
      user.role !== UserRole.FINANCE &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.PROJECT_MANAGER
    ) {
      throw new ForbiddenException('Not allowed to view money inflows');
    }
  }

  private assertCanAdjust(user: AuthUser) {
    if (
      user.role !== UserRole.FINANCE &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Not allowed to adjust attributions');
    }
  }
}
