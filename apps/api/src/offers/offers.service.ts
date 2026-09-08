import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenancyOfferStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
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

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  findByApplication(applicationId: string, user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.tenancyOffer.findMany({
      where: { applicationId },
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
      throw new BadRequestException('Offer typically follows screening; app must be pending or approved');
    }

    const rent = dto.rentAnnual ?? Number(app.rentAccepted);
    const agencyPct = dto.agencyFeePct ?? 10;
    const legalPct = dto.legalFeePct ?? 5;
    const mgmtPct = dto.managementFeePct ?? 5;
    const fees = calcOfferFeeLines(rent, agencyPct, legalPct, mgmtPct);
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

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
        landlordPayee: dto.landlordPayee,
        managementPayee: dto.managementPayee ?? 'Management entity',
        agencyPayee: dto.agencyPayee ?? 'A. A Laucarie Consulting',
        notes: dto.notes,
        status: TenancyOfferStatus.ISSUED,
      },
    });
  }

  async accept(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const offer = await this.prisma.tenancyOffer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');
    return this.prisma.tenancyOffer.update({
      where: { id },
      data: { status: TenancyOfferStatus.ACCEPTED },
    });
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
