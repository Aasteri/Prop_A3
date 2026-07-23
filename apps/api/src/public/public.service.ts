import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { displayPrice } from '../listings/listings.utils';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  companyInfo() {
    return {
      name: 'Triple A Realty Projects Ltd.',
      tagline: 'Premium property development & sales in Abuja',
      phone: '+234 800 000 0000',
      email: 'info@triplea.ng',
      whatsapp: '+2348000000000',
      badges: ['CAC Registered', 'SCUML Compliant', 'COREN Certified Engineers'],
      address: 'Abuja, Nigeria',
    };
  }

  listListings(search?: string) {
    return this.prisma.listing.findMany({
      where: {
        isPublic: true,
        status: { in: [ListingStatus.AVAILABLE, ListingStatus.RESERVED] },
        ...(search?.trim()
          ? {
              OR: [
                { location: { contains: search.trim() } },
                { propertyType: { contains: search.trim() } },
              ],
            }
          : {}),
      },
      orderBy: [{ location: 'asc' }, { listingRef: 'asc' }],
    }).then((rows) =>
      rows.map((l) => ({
        id: l.id,
        listingRef: l.listingRef,
        location: l.location,
        propertyType: l.propertyType,
        finish: l.finish,
        paymentPlan: l.paymentPlan,
        status: l.status,
        displayPrice: displayPrice(l),
      })),
    );
  }

  async getListing(id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        isPublic: true,
        status: { in: [ListingStatus.AVAILABLE, ListingStatus.RESERVED] },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return {
      ...listing,
      priceNgn: listing.priceNgn != null ? Number(listing.priceNgn) : null,
      priceOutrightNgn: listing.priceOutrightNgn != null ? Number(listing.priceOutrightNgn) : null,
      price6mNgn: listing.price6mNgn != null ? Number(listing.price6mNgn) : null,
      price12mNgn: listing.price12mNgn != null ? Number(listing.price12mNgn) : null,
      price18mNgn: listing.price18mNgn != null ? Number(listing.price18mNgn) : null,
      displayPrice: displayPrice(listing),
    };
  }

  listProjects() {
    return this.prisma.project.findMany({
      where: { status: ProjectStatus.ACTIVE },
      include: {
        site: { select: { code: true, name: true } },
        milestones: { orderBy: { stage: 'asc' } },
      },
      orderBy: { name: 'asc' },
    }).then((projects) =>
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        site: p.site,
        milestones: p.milestones.map((m) => ({
          stage: m.stage,
          progressPct: Number(m.progressPct),
        })),
      })),
    );
  }
}
