import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EarnerType,
  MoneyInflowStatus,
  NotificationType,
  PayoutBatchStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePayoutDto, PreviewPayoutDto } from './dto/payout.dto';
import type { PayoutCalcStep } from './payout.pdf';

type AggregationKey = string;

type AttributionRow = {
  id: string;
  earnerType: EarnerType;
  earnerName: string | null;
  earnerUserId: string | null;
  earnerRef: string | null;
  category: string | null;
  amount: unknown;
  inflow: { number: string; grossAmount: unknown };
};

type LineDraft = {
  earnerType: EarnerType;
  earnerName: string;
  earnerUserId: string | null;
  earnerRef: string | null;
  category: string | null;
  calcDetail: string;
  sharePct: number;
  grossBase: number;
  amount: number;
  moneyAttributionIds: string[];
  sortOrder: number;
};

export type CalculationResult = {
  periodStart: string;
  periodEnd: string;
  calculationJson: PayoutCalcStep[];
  grossInflows: number;
  totalAttributions: number;
  companyRetain: number;
  totalPayable: number;
  lines: LineDraft[];
  inflowCount: number;
  attributionCount: number;
};

const FEE_DEFAULTS = {
  agencyLettingPct: 10,
  legalPct: 5,
  managementPct: 5,
  applicationAgencyLegalPct: 20,
  worksPlatformPct: 10,
  servicesArtisanLabourPct: 2.5,
  externalAgentOfAgencyPct: 50,
} as const;

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.payoutBatch
      .findMany({
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
        orderBy: [{ periodEnd: 'desc' }, { createdAt: 'desc' }],
      })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.payoutBatch.findUnique({
      where: { id },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!row) throw new NotFoundException('Payout batch not found');
    return this.serialize(row);
  }

  async preview(dto: PreviewPayoutDto, user: AuthUser) {
    this.assertCanView(user);
    return this.calculatePeriod(dto.periodStart, dto.periodEnd);
  }

  async create(dto: CreatePayoutDto, user: AuthUser) {
    this.assertCanMutateFinance(user);
    const calc = await this.calculatePeriod(dto.periodStart, dto.periodEnd);
    const number = await this.generateBatchNumber();
    const preparedBy = this.displayName(user);

    const row = await this.prisma.payoutBatch.create({
      data: {
        number,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        status: PayoutBatchStatus.DRAFT,
        calculationJson: calc.calculationJson,
        grossInflows: calc.grossInflows,
        totalAttributions: calc.totalAttributions,
        totalPayable: calc.totalPayable,
        companyRetain: calc.companyRetain,
        preparedBy,
        nextApproverRole: null,
        notes: dto.notes,
        lines: {
          create: calc.lines.map((l) => ({
            earnerType: l.earnerType,
            earnerName: l.earnerName,
            earnerUserId: l.earnerUserId,
            earnerRef: l.earnerRef,
            category: l.category,
            calcDetail: l.calcDetail,
            sharePct: l.sharePct,
            grossBase: l.grossBase,
            amount: l.amount,
            moneyAttributionIds: l.moneyAttributionIds,
            sortOrder: l.sortOrder,
          })),
        },
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });

    return this.serialize(row);
  }

  async submit(id: string, user: AuthUser) {
    this.assertCanMutateFinance(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== PayoutBatchStatus.DRAFT) {
      throw new BadRequestException('Only draft payouts can be submitted');
    }
    const row = await this.prisma.payoutBatch.update({
      where: { id },
      data: {
        status: PayoutBatchStatus.PENDING_FINANCE,
        nextApproverRole: 'FINANCE',
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });

    const recipients = (await this.notifications.financeUserIds()).filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PAYOUT_BATCH,
        title: `Payout awaiting Finance — ${row.number}`,
        body: `Period payout · payable NGN ${Number(row.totalPayable).toLocaleString()} · Finance review required`,
        linkUrl: '/payouts',
      });
    }

    return this.serialize(row);
  }

  async financeApprove(id: string, user: AuthUser) {
    this.assertCanMutateFinance(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== PayoutBatchStatus.PENDING_FINANCE) {
      throw new BadRequestException('Payout must be pending Finance review');
    }
    const row = await this.prisma.payoutBatch.update({
      where: { id },
      data: {
        status: PayoutBatchStatus.PENDING_EXEC,
        nextApproverRole: 'CEO_OR_ADMIN',
        financeReviewedBy: this.displayName(user),
        financeReviewedAt: new Date(),
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });

    const recipients = (await this.notifications.ceoUserIds()).filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PAYOUT_BATCH,
        title: `Payout awaiting CEO/Admin — ${row.number}`,
        body: `Finance approved · payable NGN ${Number(row.totalPayable).toLocaleString()}`,
        linkUrl: '/payouts',
      });
    }

    return this.serialize(row);
  }

  async execApprove(id: string, user: AuthUser) {
    this.assertCanExecApprove(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== PayoutBatchStatus.PENDING_EXEC) {
      throw new BadRequestException('Payout must be pending executive approval');
    }
    const row = await this.prisma.payoutBatch.update({
      where: { id },
      data: {
        status: PayoutBatchStatus.APPROVED,
        nextApproverRole: 'FINANCE',
        execApprovedBy: this.displayName(user),
        execApprovedAt: new Date(),
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });

    const recipients = (await this.notifications.financeUserIds()).filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PAYOUT_BATCH,
        title: `Payout approved — mark paid · ${row.number}`,
        body: `CEO/Admin approved · payable NGN ${Number(row.totalPayable).toLocaleString()}`,
        linkUrl: '/payouts',
      });
    }

    return this.serialize(row);
  }

  async markPaid(id: string, user: AuthUser) {
    this.assertCanMutateFinance(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== PayoutBatchStatus.APPROVED) {
      throw new BadRequestException('Only approved payouts can be marked paid');
    }
    const row = await this.prisma.payoutBatch.update({
      where: { id },
      data: {
        status: PayoutBatchStatus.PAID,
        nextApproverRole: 'DONE',
        paidBy: this.displayName(user),
        paidAt: new Date(),
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });

    return this.serialize(row);
  }

  async buildPdf(id: string, user: AuthUser) {
    const row = await this.findOne(id, user);
    const { buildPayoutPdf } = await import('./payout.pdf');
    const steps = (row.calculationJson as PayoutCalcStep[]) ?? [];
    return buildPayoutPdf({
      number: row.number as string,
      status: row.status as string,
      periodStart: new Date(row.periodStart as string | Date),
      periodEnd: new Date(row.periodEnd as string | Date),
      nextApproverLabel: this.nextApproverLabel(row.nextApproverRole as string | null),
      grossInflows: Number(row.grossInflows),
      totalAttributions: Number(row.totalAttributions),
      companyRetain: Number(row.companyRetain),
      totalPayable: Number(row.totalPayable),
      notes: (row.notes as string | null) ?? null,
      preparedBy: (row.preparedBy as string | null) ?? null,
      financeReviewedBy: (row.financeReviewedBy as string | null) ?? null,
      financeReviewedAt: row.financeReviewedAt
        ? new Date(row.financeReviewedAt as string | Date)
        : null,
      execApprovedBy: (row.execApprovedBy as string | null) ?? null,
      execApprovedAt: row.execApprovedAt
        ? new Date(row.execApprovedAt as string | Date)
        : null,
      paidBy: (row.paidBy as string | null) ?? null,
      paidAt: row.paidAt ? new Date(row.paidAt as string | Date) : null,
      calculationSteps: steps,
      lines: (row.lines ?? []).map((l) => ({
        earnerType: String(l.earnerType),
        earnerName: String(l.earnerName),
        category: (l.category as string | null) ?? null,
        calcDetail: String(l.calcDetail),
        sharePct: l.sharePct != null ? Number(l.sharePct) : null,
        amount: Number(l.amount),
      })),
      issuedAt: new Date(row.createdAt as string | Date),
    });
  }

  /**
   * Aggregate ALLOCATED/RECEIVED money attributions in period; document fee defaults
   * in calculationJson. Prefer stored attribution amounts as source of truth.
   */
  private async calculatePeriod(periodStart: string, periodEnd: string): Promise<CalculationResult> {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw new BadRequestException('Invalid period');
    }
    const endInclusive = new Date(end);
    endInclusive.setHours(23, 59, 59, 999);

    const inflows = await this.prisma.moneyInflow.findMany({
      where: {
        receivedAt: { gte: start, lte: endInclusive },
        status: { in: [MoneyInflowStatus.ALLOCATED, MoneyInflowStatus.RECEIVED] },
      },
      include: {
        attributions: true,
      },
      orderBy: { receivedAt: 'asc' },
    });

    const attributions: AttributionRow[] = inflows.flatMap((inf) =>
      inf.attributions.map((a) => ({
        id: a.id,
        earnerType: a.earnerType,
        earnerName: a.earnerName,
        earnerUserId: a.earnerUserId,
        earnerRef: a.earnerRef,
        category: a.category,
        amount: a.amount,
        inflow: { number: inf.number, grossAmount: inf.grossAmount },
      })),
    );

    const grossInflows =
      Math.round(inflows.reduce((s, i) => s + Number(i.grossAmount), 0) * 100) / 100;

    const buckets = new Map<
      AggregationKey,
      {
        earnerType: EarnerType;
        earnerName: string;
        earnerUserId: string | null;
        earnerRef: string | null;
        category: string | null;
        amount: number;
        attributionIds: string[];
        inflowRefs: { number: string; category: string | null; amount: number }[];
      }
    >();

    for (const a of attributions) {
      const earnerName = a.earnerName?.trim() || this.defaultEarnerName(a.earnerType);
      const key = [
        a.earnerType,
        earnerName.toLowerCase(),
        a.earnerRef ?? '',
        a.category ?? '',
      ].join('|');
      const amount = Number(a.amount);
      const existing = buckets.get(key);
      if (existing) {
        existing.amount = Math.round((existing.amount + amount) * 100) / 100;
        existing.attributionIds.push(a.id);
        existing.inflowRefs.push({
          number: a.inflow.number,
          category: a.category,
          amount,
        });
        if (!existing.earnerUserId && a.earnerUserId) existing.earnerUserId = a.earnerUserId;
      } else {
        buckets.set(key, {
          earnerType: a.earnerType,
          earnerName,
          earnerUserId: a.earnerUserId,
          earnerRef: a.earnerRef,
          category: a.category,
          amount: Math.round(amount * 100) / 100,
          attributionIds: [a.id],
          inflowRefs: [
            { number: a.inflow.number, category: a.category, amount },
          ],
        });
      }
    }

    const totalAttributions =
      Math.round([...buckets.values()].reduce((s, b) => s + b.amount, 0) * 100) / 100;

    const companyRetain =
      Math.round(
        [...buckets.values()]
          .filter((b) => b.earnerType === EarnerType.COMPANY)
          .reduce((s, b) => s + b.amount, 0) * 100,
      ) / 100;

    const totalPayable = Math.round((totalAttributions - companyRetain) * 100) / 100;

    const lines: LineDraft[] = [...buckets.values()]
      .sort((a, b) => {
        if (a.earnerType === EarnerType.COMPANY && b.earnerType !== EarnerType.COMPANY) return 1;
        if (b.earnerType === EarnerType.COMPANY && a.earnerType !== EarnerType.COMPANY) return -1;
        return b.amount - a.amount || a.earnerName.localeCompare(b.earnerName);
      })
      .map((b, idx) => {
        const sharePct =
          grossInflows > 0
            ? Math.round((b.amount / grossInflows) * 10000) / 100
            : 0;
        const inflowList = b.inflowRefs
          .map(
            (r) =>
              `${r.number} (${r.category ?? 'uncategorised'}) NGN ${r.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
          )
          .join('; ');
        const calcDetail = [
          `Roll-up of ${b.inflowRefs.length} attribution(s) for ${b.earnerType}${b.category ? ` / ${b.category}` : ''}.`,
          `Share of period gross: ${sharePct.toFixed(4)}% of NGN ${grossInflows.toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`,
          `Inflows: ${inflowList || '—'}.`,
          this.categoryRuleNote(b.category, b.earnerType),
        ]
          .filter(Boolean)
          .join(' ');

        return {
          earnerType: b.earnerType,
          earnerName: b.earnerName,
          earnerUserId: b.earnerUserId,
          earnerRef: b.earnerRef,
          category: b.category,
          calcDetail,
          sharePct,
          grossBase: grossInflows,
          amount: b.amount,
          moneyAttributionIds: b.attributionIds,
          sortOrder: idx,
        };
      });

    const agencyFeeTotal =
      Math.round(
        attributions
          .filter((a) => a.category === 'AGENCY_FEE')
          .reduce((s, a) => s + Number(a.amount), 0) * 100,
      ) / 100;
    const commissionTotal =
      Math.round(
        attributions
          .filter((a) => a.category === 'COMMISSION')
          .reduce((s, a) => s + Number(a.amount), 0) * 100,
      ) / 100;
    const impliedAgent50 =
      Math.round(agencyFeeTotal * (FEE_DEFAULTS.externalAgentOfAgencyPct / 100) * 100) / 100;

    const calculationJson: PayoutCalcStep[] = [
      {
        step: '1. Period gross inflows',
        formula: 'SUM(MoneyInflow.grossAmount) where status ∈ {ALLOCATED, RECEIVED} and receivedAt in period',
        inputs: `${inflows.length} inflow(s) from ${periodStart} to ${periodEnd}`,
        result: `NGN ${grossInflows.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        notes: 'Includes bank transfer and Paystack receipts in the period.',
      },
      {
        step: '2. Fee defaults (product reference)',
        formula: 'Documented system defaults — applied when attributions were created; not re-computed over stored amounts',
        inputs: [
          `Agency/letting: PM engagement or ${FEE_DEFAULTS.agencyLettingPct}%`,
          `Legal: ${FEE_DEFAULTS.legalPct}%`,
          `Management: ${FEE_DEFAULTS.managementPct}%`,
          `Application Agency+Legal: ${FEE_DEFAULTS.applicationAgencyLegalPct}%`,
          `Works platform: ${FEE_DEFAULTS.worksPlatformPct}% of works contract`,
          `Services/artisan platform: ${FEE_DEFAULTS.servicesArtisanLabourPct}% of labour only`,
          `External agent commission: ${FEE_DEFAULTS.externalAgentOfAgencyPct}% of company agency fee unless COMMISSION attribution already exists`,
        ].join('; '),
        result: 'Defaults recorded for audit',
        notes:
          'MoneyAttribution rows already in the period are the source of truth for payout amounts.',
      },
      {
        step: '3. Aggregate attributions',
        formula: 'GROUP BY (earnerType, earnerName, earnerRef, category); SUM(amount)',
        inputs: `${attributions.length} attribution line(s) across ${inflows.length} inflow(s)`,
        result: `NGN ${totalAttributions.toLocaleString('en-NG', { minimumFractionDigits: 2 })} across ${lines.length} payout line(s)`,
      },
      {
        step: '4. Share % per line',
        formula: 'sharePct = line.amount / grossInflows × 100',
        inputs: `grossInflows = NGN ${grossInflows.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        result: 'Each line stores sharePct and calcDetail with inflow numbers',
      },
      {
        step: '5. External agent commission check',
        formula: `Prefer existing COMMISSION attributions; else default ${FEE_DEFAULTS.externalAgentOfAgencyPct}% of AGENCY_FEE`,
        inputs: `AGENCY_FEE total NGN ${agencyFeeTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}; COMMISSION total NGN ${commissionTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}; implied ${FEE_DEFAULTS.externalAgentOfAgencyPct}% = NGN ${impliedAgent50.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        result:
          commissionTotal > 0
            ? 'Using stored COMMISSION attributions (preferred)'
            : agencyFeeTotal > 0
              ? 'No COMMISSION attributions in period — agency fee remains on company lines unless Finance adjusts inflows'
              : 'No agency/commission attributions in period',
        notes:
          'Payout does not invent new agent lines; adjust money-inflow attributions if a commission split is missing.',
      },
      {
        step: '6. Company retain',
        formula: 'SUM(lines where earnerType = COMPANY)',
        inputs: `${lines.filter((l) => l.earnerType === EarnerType.COMPANY).length} company line(s)`,
        result: `NGN ${companyRetain.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      },
      {
        step: '7. Total payable to external parties',
        formula: 'totalAttributions − companyRetain',
        inputs: `NGN ${totalAttributions.toLocaleString('en-NG', { minimumFractionDigits: 2 })} − NGN ${companyRetain.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        result: `NGN ${totalPayable.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        notes: 'Approval trail: Finance → CEO or Admin → Finance marks paid.',
      },
    ];

    return {
      periodStart,
      periodEnd,
      calculationJson,
      grossInflows,
      totalAttributions,
      companyRetain,
      totalPayable,
      lines,
      inflowCount: inflows.length,
      attributionCount: attributions.length,
    };
  }

  private categoryRuleNote(category: string | null, earnerType: EarnerType): string {
    switch (category) {
      case 'AGENCY_FEE':
        return `Rule: agency/letting from PM engagement or ${FEE_DEFAULTS.agencyLettingPct}%.`;
      case 'MANAGEMENT_FEE':
        return `Rule: management fee default ${FEE_DEFAULTS.managementPct}%.`;
      case 'WORKS_FEE':
      case 'PLATFORM_FEE_10':
        return `Rule: works platform ${FEE_DEFAULTS.worksPlatformPct}% of works contract.`;
      case 'PLATFORM_FEE_2_5':
      case 'ARTISAN_FEE':
        return `Rule: services/artisan platform ${FEE_DEFAULTS.servicesArtisanLabourPct}% of labour only.`;
      case 'COMMISSION':
        return `Rule: external agent commission — stored COMMISSION preferred over ${FEE_DEFAULTS.externalAgentOfAgencyPct}% of agency fee.`;
      case 'RENT_TO_LANDLORD':
        return 'Rule: rent remitted to landlord (not company retain).';
      default:
        if (earnerType === EarnerType.EXTERNAL_AGENT) {
          return `Rule: external agent — prefer COMMISSION attribution; else ${FEE_DEFAULTS.externalAgentOfAgencyPct}% of company agency fee on the deal.`;
        }
        if (category === 'OTHER' && earnerType === EarnerType.COMPANY) {
          return `Rule: legal fee default ${FEE_DEFAULTS.legalPct}%; application Agency+Legal ${FEE_DEFAULTS.applicationAgencyLegalPct}% where applicable.`;
        }
        return '';
    }
  }

  private defaultEarnerName(type: EarnerType): string {
    switch (type) {
      case EarnerType.COMPANY:
        return 'Triple A Realty Projects Ltd';
      case EarnerType.LANDLORD:
        return 'Landlord';
      case EarnerType.EXTERNAL_AGENT:
        return 'External agent';
      case EarnerType.ARTISAN:
        return 'Artisan';
      default:
        return type.replace(/_/g, ' ');
    }
  }

  private async generateBatchNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `PAYOUT-${year}${month}-`;
    const latest = await this.prisma.payoutBatch.findFirst({
      where: { number: { startsWith: prefix } },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    let seq = 1;
    if (latest) {
      const parsed = parseInt(latest.number.slice(prefix.length), 10);
      if (!Number.isNaN(parsed)) seq = parsed + 1;
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  private displayName(user: AuthUser) {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  nextApproverLabel(role: string | null | undefined): string {
    switch (role) {
      case 'FINANCE':
        return 'Finance Officer';
      case 'CEO_OR_ADMIN':
        return 'CEO or Admin';
      case 'DONE':
        return 'Complete';
      default:
        return '—';
    }
  }

  private serialize<T extends Record<string, unknown>>(row: T) {
    const r = row as T & {
      grossInflows: unknown;
      totalAttributions: unknown;
      totalPayable: unknown;
      companyRetain: unknown;
      nextApproverRole: string | null;
      calculationJson: unknown;
      lines?: Array<Record<string, unknown> & { amount: unknown; sharePct: unknown; grossBase: unknown }>;
    };
    return {
      ...r,
      grossInflows: Number(r.grossInflows),
      totalAttributions: Number(r.totalAttributions),
      totalPayable: Number(r.totalPayable),
      companyRetain: Number(r.companyRetain),
      nextApproverLabel: this.nextApproverLabel(r.nextApproverRole),
      calculation: r.calculationJson,
      lines: (r.lines ?? []).map((l) => ({
        ...l,
        amount: Number(l.amount),
        sharePct: l.sharePct != null ? Number(l.sharePct) : null,
        grossBase: l.grossBase != null ? Number(l.grossBase) : null,
      })),
    };
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.PROJECT_MANAGER,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanMutateFinance(user: AuthUser) {
    if (
      user.role !== UserRole.FINANCE &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Finance, CEO, or Admin required');
    }
  }

  private assertCanExecApprove(user: AuthUser) {
    if (user.role !== UserRole.CEO && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('CEO or Admin required for executive approval');
    }
  }
}
