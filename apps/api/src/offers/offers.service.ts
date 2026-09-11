import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  InvoiceType,
  NotificationType,
  TenancyOfferStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { generateInvoiceNumber } from '../invoices/invoices.utils';
import { CreateTenancyOfferDto } from './dto/offer.dto';

/** Doc 10 defaults — separate from Doc 12 application 20% Agency+Legal clause. */
export function calcOfferFeeLines(
  rent: number,
  agencyPct = 10,
  legalPct = 5,
  mgmtPct = 5,
) {
  return {
    agencyFeeAmount: Math.round(rent * (agencyPct / 100) * 100) / 100,
    legalFeeAmount: Math.round(rent * (legalPct / 100) * 100) / 100,
    managementFeeAmount: Math.round(rent * (mgmtPct / 100) * 100) / 100,
  };
}

const settlementSelect = {
  id: true,
  name: true,
  bankName: true,
  accountName: true,
  accountNumber: true,
  isDefault: true,
};

const invoiceSelect = {
  id: true,
  invoiceNumber: true,
  status: true,
  outstanding: true,
  revisedTotal: true,
  invoiceType: true,
};

const include = {
  landlordSettlement: { select: settlementSelect },
  managementSettlement: { select: settlementSelect },
  agencySettlement: { select: settlementSelect },
  landlordInvoice: { select: invoiceSelect },
  managementInvoice: { select: invoiceSelect },
  agencyInvoice: { select: invoiceSelect },
};

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findByApplication(applicationId: string, user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.tenancyOffer.findMany({
      where: { applicationId },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateTenancyOfferDto, user: AuthUser) {
    this.assertCanManage(user);
    const app = await this.prisma.tenantApplication.findUnique({
      where: { id: dto.applicationId },
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.status !== 'APPROVED' && app.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(
        'Offer typically follows screening; app must be pending or approved',
      );
    }

    const rent = dto.rentAnnual ?? Number(app.rentAccepted);
    const agencyPct = dto.agencyFeePct ?? 10;
    const legalPct = dto.legalFeePct ?? 5;
    const mgmtPct = dto.managementFeePct ?? 5;
    const fees = calcOfferFeeLines(rent, agencyPct, legalPct, mgmtPct);
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

    const landlordEntity = dto.landlordSettlementEntityId
      ? await this.requireSettlement(dto.landlordSettlementEntityId)
      : null;
    const managementEntity = dto.managementSettlementEntityId
      ? await this.requireSettlement(dto.managementSettlementEntityId)
      : await this.prisma.settlementEntity.findFirst({ where: { isDefault: true } });
    const agencyEntity = dto.agencySettlementEntityId
      ? await this.requireSettlement(dto.agencySettlementEntityId)
      : await this.prisma.settlementEntity.findFirst({
          where: { name: { contains: 'Laucarie' } },
        });

    return this.prisma.tenancyOffer.create({
      data: {
        number: `OFF-${year}-${stamp}`,
        applicationId: dto.applicationId,
        rentAnnual: rent,
        cautionAmount: dto.cautionAmount ?? Math.round(rent * 0.1 * 100) / 100,
        agencyFeePct: agencyPct,
        legalFeePct: legalPct,
        managementFeePct: mgmtPct,
        ...fees,
        serviceChargeAnnual: dto.serviceChargeAnnual ?? 0,
        estateServiceCharge: dto.estateServiceCharge ?? 0,
        serviceChargeNotes:
          dto.serviceChargeNotes ??
          'External lights, cleaning, AEPB, water, security (configurable)',
        landlordSettlementEntityId: landlordEntity?.id,
        managementSettlementEntityId: managementEntity?.id,
        agencySettlementEntityId: agencyEntity?.id,
        landlordPayee: dto.landlordPayee ?? landlordEntity?.name,
        managementPayee:
          dto.managementPayee ?? managementEntity?.name ?? 'Management entity',
        agencyPayee:
          dto.agencyPayee ?? agencyEntity?.name ?? 'A. A Laucarie Consulting',
        notes: dto.notes,
        status: TenancyOfferStatus.ISSUED,
      },
      include,
    });
  }

  /**
   * Accept offer and spawn Doc 10 split invoices (landlord / management+legal / agency).
   * Separate from Doc 12 application 20% Agency+Legal invoice.
   */
  async accept(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const offer = await this.prisma.tenancyOffer.findUnique({
      where: { id },
      include: {
        ...include,
        application: {
          select: {
            surname: true,
            otherNames: true,
            permanentAddress: true,
            applicationRef: true,
            estate: { select: { name: true } },
          },
        },
      },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.status === TenancyOfferStatus.ACCEPTED && offer.landlordInvoiceId) {
      return this.findOne(id, user);
    }
    if (offer.status !== TenancyOfferStatus.ISSUED && offer.status !== TenancyOfferStatus.ACCEPTED) {
      throw new BadRequestException('Only issued offers can be accepted');
    }

    const clientName = `${offer.application.surname} ${offer.application.otherNames}`.trim();
    const clientAddress = offer.application.permanentAddress;
    const details = `Offer ${offer.number} · ${offer.application.applicationRef} · ${offer.application.estate.name}`;
    const issueDate = new Date();
    const year = issueDate.getFullYear();

    const landlordAmt =
      Number(offer.rentAnnual) +
      Number(offer.cautionAmount) +
      Number(offer.serviceChargeAnnual) +
      Number(offer.estateServiceCharge);
    const managementAmt = Number(offer.managementFeeAmount) + Number(offer.legalFeeAmount);
    const agencyAmt = Number(offer.agencyFeeAmount);

    if (landlordAmt > 0 && !offer.landlordSettlementEntityId) {
      throw new BadRequestException('Assign landlord settlement account before accept');
    }
    if (managementAmt > 0 && !offer.managementSettlementEntityId) {
      throw new BadRequestException('Assign management settlement account before accept');
    }
    if (agencyAmt > 0 && !offer.agencySettlementEntityId) {
      throw new BadRequestException('Assign agency settlement account before accept');
    }

    await this.prisma.$transaction(async (tx) => {
      let landlordInvoiceId = offer.landlordInvoiceId;
      let managementInvoiceId = offer.managementInvoiceId;
      let agencyInvoiceId = offer.agencyInvoiceId;

      if (landlordAmt > 0 && !landlordInvoiceId && offer.landlordSettlementEntityId) {
        const invoiceNumber = await generateInvoiceNumber(tx, InvoiceType.RENTAL, year);
        const inv = await tx.invoice.create({
          data: {
            settlementEntityId: offer.landlordSettlementEntityId,
            invoiceNumber,
            invoiceType: InvoiceType.RENTAL,
            status: InvoiceStatus.SENT,
            issueDate,
            contractRef: offer.number,
            clientName,
            clientAddress,
            projectDetails: `${details} — Landlord (rent / caution / SC)`,
            paymentTerms: 'Per offer letter Doc 10 settlement account',
            baseTotal: landlordAmt,
            revisedTotal: landlordAmt,
            outstanding: landlordAmt,
            createdById: user.id,
            sentAt: new Date(),
            lines: {
              create: [
                {
                  description: 'Annual rent',
                  quantity: 1,
                  unit: 'yr',
                  unitPrice: Number(offer.rentAnnual),
                  totalAmount: Number(offer.rentAnnual),
                  sortOrder: 0,
                },
                {
                  description: 'Caution deposit',
                  quantity: 1,
                  unit: 'lot',
                  unitPrice: Number(offer.cautionAmount),
                  totalAmount: Number(offer.cautionAmount),
                  sortOrder: 1,
                },
                ...(Number(offer.serviceChargeAnnual) > 0
                  ? [
                      {
                        description: 'Service charge (annual)',
                        quantity: 1,
                        unit: 'yr',
                        unitPrice: Number(offer.serviceChargeAnnual),
                        totalAmount: Number(offer.serviceChargeAnnual),
                        sortOrder: 2,
                      },
                    ]
                  : []),
                ...(Number(offer.estateServiceCharge) > 0
                  ? [
                      {
                        description: 'Estate service charge',
                        quantity: 1,
                        unit: 'lot',
                        unitPrice: Number(offer.estateServiceCharge),
                        totalAmount: Number(offer.estateServiceCharge),
                        sortOrder: 3,
                      },
                    ]
                  : []),
              ],
            },
          },
        });
        landlordInvoiceId = inv.id;
      }

      if (managementAmt > 0 && !managementInvoiceId && offer.managementSettlementEntityId) {
        const invoiceNumber = await generateInvoiceNumber(tx, InvoiceType.SERVICE, year);
        const inv = await tx.invoice.create({
          data: {
            settlementEntityId: offer.managementSettlementEntityId,
            invoiceNumber,
            invoiceType: InvoiceType.SERVICE,
            status: InvoiceStatus.SENT,
            issueDate,
            contractRef: offer.number,
            clientName,
            clientAddress,
            projectDetails: `${details} — Management + Legal (Doc 10)`,
            paymentTerms: 'Per offer letter — Legal routed with management account',
            baseTotal: managementAmt,
            revisedTotal: managementAmt,
            outstanding: managementAmt,
            createdById: user.id,
            sentAt: new Date(),
            lines: {
              create: [
                {
                  description: `Management fee (${Number(offer.managementFeePct)}%)`,
                  quantity: 1,
                  unit: 'lot',
                  unitPrice: Number(offer.managementFeeAmount),
                  totalAmount: Number(offer.managementFeeAmount),
                  sortOrder: 0,
                },
                {
                  description: `Legal fee (${Number(offer.legalFeePct)}%)`,
                  quantity: 1,
                  unit: 'lot',
                  unitPrice: Number(offer.legalFeeAmount),
                  totalAmount: Number(offer.legalFeeAmount),
                  sortOrder: 1,
                },
              ],
            },
          },
        });
        managementInvoiceId = inv.id;
      }

      if (agencyAmt > 0 && !agencyInvoiceId && offer.agencySettlementEntityId) {
        const invoiceNumber = await generateInvoiceNumber(tx, InvoiceType.AGENCY, year);
        const inv = await tx.invoice.create({
          data: {
            settlementEntityId: offer.agencySettlementEntityId,
            invoiceNumber,
            invoiceType: InvoiceType.AGENCY,
            status: InvoiceStatus.SENT,
            issueDate,
            contractRef: offer.number,
            clientName,
            clientAddress,
            projectDetails: `${details} — Agency ${Number(offer.agencyFeePct)}% (Doc 10; separate from Doc 12 20% clause)`,
            paymentTerms: 'Per offer letter Doc 10 agency account',
            baseTotal: agencyAmt,
            revisedTotal: agencyAmt,
            outstanding: agencyAmt,
            createdById: user.id,
            sentAt: new Date(),
            lines: {
              create: [
                {
                  description: `Agency fee (${Number(offer.agencyFeePct)}% of annual rent) — Doc 10`,
                  quantity: 1,
                  unit: 'lot',
                  unitPrice: agencyAmt,
                  totalAmount: agencyAmt,
                  sortOrder: 0,
                },
              ],
            },
          },
        });
        agencyInvoiceId = inv.id;
      }

      await tx.tenancyOffer.update({
        where: { id },
        data: {
          status: TenancyOfferStatus.ACCEPTED,
          landlordInvoiceId,
          managementInvoiceId,
          agencyInvoiceId,
        },
      });
    });

    const financeIds = (await this.notifications.financeUserIds()).filter((id) => id !== user.id);
    if (financeIds.length) {
      await this.notifications.notifyUsers(financeIds, {
        type: NotificationType.TENANCY_OFFER_ACCEPTED,
        title: `Offer accepted — ${offer.number}`,
        body: `${clientName} · split invoices created (landlord / management+legal / agency)`,
        linkUrl: `/tenant-applications/${offer.applicationId}`,
      });
    }

    return this.findOne(id, user);
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const offer = await this.prisma.tenancyOffer.findUnique({
      where: { id },
      include: {
        ...include,
        application: {
          select: {
            surname: true,
            otherNames: true,
            estate: { select: { name: true } },
            terrierRow: { select: { propertyType: true, location: true, serialNo: true } },
          },
        },
      },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async buildPdf(id: string, user: AuthUser) {
    const offer = await this.findOne(id, user);
    const settlements = [];
    if (offer.landlordSettlement) {
      settlements.push({
        label: 'Landlord — rent / caution',
        name: offer.landlordSettlement.name,
        bankName: offer.landlordSettlement.bankName,
        accountName: offer.landlordSettlement.accountName,
        accountNumber: offer.landlordSettlement.accountNumber,
        amount: Number(offer.rentAnnual) + Number(offer.cautionAmount),
      });
    }
    if (offer.managementSettlement) {
      settlements.push({
        label: 'Management (+ Legal 5%)',
        name: offer.managementSettlement.name,
        bankName: offer.managementSettlement.bankName,
        accountName: offer.managementSettlement.accountName,
        accountNumber: offer.managementSettlement.accountNumber,
        amount: Number(offer.managementFeeAmount) + Number(offer.legalFeeAmount),
        pct: Number(offer.managementFeePct) + Number(offer.legalFeePct),
      });
    }
    if (offer.agencySettlement) {
      settlements.push({
        label: 'Agency (10%)',
        name: offer.agencySettlement.name,
        bankName: offer.agencySettlement.bankName,
        accountName: offer.agencySettlement.accountName,
        accountNumber: offer.agencySettlement.accountNumber,
        amount: Number(offer.agencyFeeAmount),
        pct: Number(offer.agencyFeePct),
      });
    }

    const app = offer.application;
    const propertyLabel = app.terrierRow
      ? `#${app.terrierRow.serialNo} ${app.terrierRow.propertyType} · ${app.terrierRow.location}`
      : app.estate.name;

    const { buildTenancyOfferPdf } = await import('./tenancy-offer.pdf');
    return buildTenancyOfferPdf({
      number: offer.number,
      applicantName: `${app.surname} ${app.otherNames}`,
      propertyLabel,
      rentAnnual: Number(offer.rentAnnual),
      cautionAmount: Number(offer.cautionAmount),
      agencyFeePct: Number(offer.agencyFeePct),
      agencyFeeAmount: Number(offer.agencyFeeAmount),
      legalFeePct: Number(offer.legalFeePct),
      legalFeeAmount: Number(offer.legalFeeAmount),
      managementFeePct: Number(offer.managementFeePct),
      managementFeeAmount: Number(offer.managementFeeAmount),
      serviceChargeAnnual: Number(offer.serviceChargeAnnual),
      estateServiceCharge: Number(offer.estateServiceCharge),
      serviceChargeNotes: offer.serviceChargeNotes,
      settlements,
      issuedAt: offer.createdAt,
    });
  }

  private async requireSettlement(id: string) {
    const row = await this.prisma.settlementEntity.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Settlement entity ${id} not found`);
    return row;
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
