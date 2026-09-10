import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SalesOfferResponse, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateSalesOfferDto, RespondSalesOfferDto } from './dto/sales-offer.dto';

const include = {
  lead: {
    select: {
      id: true,
      leadRef: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      stage: true,
    },
  },
  listing: {
    select: {
      id: true,
      listingRef: true,
      location: true,
      propertyType: true,
      priceNgn: true,
      priceOutrightNgn: true,
    },
  },
};

@Injectable()
export class SalesOffersService {
  constructor(private readonly prisma: PrismaService) {}

  findByLead(leadId: string, user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.salesOffer.findMany({
      where: { leadId },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.salesOffer.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Sales offer not found');
    return row;
  }

  async create(dto: CreateSalesOfferDto, user: AuthUser) {
    this.assertCanManage(user);
    const lead = await this.prisma.lead.findUnique({ where: { id: dto.leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.stage === 'WON' || lead.stage === 'LOST') {
      throw new BadRequestException('Cannot issue offer on a closed lead');
    }

    const listingId = dto.listingId ?? lead.listingId ?? undefined;
    if (listingId) {
      const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) throw new NotFoundException('Listing not found');
    }

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

    return this.prisma.salesOffer.create({
      data: {
        number: `SOF-${year}-${stamp}`,
        leadId: dto.leadId,
        listingId,
        offerPrice: dto.offerPrice,
        validityUntil: dto.validityUntil ? new Date(dto.validityUntil) : undefined,
        conditions: dto.conditions,
        depositRequired: dto.depositRequired,
        paymentTerms: dto.paymentTerms,
        preparedBy: dto.preparedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        notes: dto.notes,
        buyerResponse: SalesOfferResponse.PENDING,
      },
      include,
    });
  }

  async respond(id: string, dto: RespondSalesOfferDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (
      existing.buyerResponse === SalesOfferResponse.ACCEPTED ||
      existing.buyerResponse === SalesOfferResponse.REJECTED
    ) {
      throw new BadRequestException('Offer already closed');
    }
    if (dto.buyerResponse === SalesOfferResponse.COUNTERED && dto.counterPrice == null) {
      throw new BadRequestException('Counter price is required when response is COUNTERED');
    }

    const updated = await this.prisma.salesOffer.update({
      where: { id },
      data: {
        buyerResponse: dto.buyerResponse,
        counterPrice: dto.counterPrice,
        notes: dto.notes ?? existing.notes,
      },
      include,
    });

    if (dto.buyerResponse === SalesOfferResponse.ACCEPTED) {
      await this.prisma.lead.update({
        where: { id: existing.leadId },
        data: { dealValueNgn: Number(updated.offerPrice) },
      });
    }

    return updated;
  }

  async hasAcceptedOffer(leadId: string) {
    const count = await this.prisma.salesOffer.count({
      where: { leadId, buyerResponse: SalesOfferResponse.ACCEPTED },
    });
    return count > 0;
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.SALES,
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.SALES,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.PROJECT_MANAGER,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
