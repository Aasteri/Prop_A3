import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateListingDto,
  ListListingsQueryDto,
  UpdateListingDto,
} from './dto/listing.dto';
import { generateListingRef } from './listings.utils';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, query: ListListingsQueryDto = {}) {
    this.assertCanView(user);
    const search = query.search?.trim();

    return this.prisma.listing.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.finish ? { finish: query.finish } : {}),
        ...(query.location
          ? { location: { contains: query.location } }
          : {}),
        ...(search
          ? {
              OR: [
                { location: { contains: search } },
                { propertyType: { contains: search } },
                { listingRef: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [{ location: 'asc' }, { listingRef: 'asc' }],
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async create(dto: CreateListingDto, user: AuthUser) {
    this.assertCanManage(user);

    return this.prisma.$transaction(async (tx) => {
      const listingRef = dto.listingRef ?? (await generateListingRef(tx));
      return tx.listing.create({
        data: {
          listingRef,
          location: dto.location,
          propertyType: dto.propertyType,
          finish: dto.finish,
          paymentPlan: dto.paymentPlan,
          listingType: dto.listingType,
          status: dto.status ?? ListingStatus.AVAILABLE,
          priceNgn: dto.priceNgn,
          priceOutrightNgn: dto.priceOutrightNgn,
          price6mNgn: dto.price6mNgn,
          price12mNgn: dto.price12mNgn,
          price18mNgn: dto.price18mNgn,
          sourceDocument: dto.sourceDocument,
          notes: dto.notes,
          isPublic: dto.isPublic ?? true,
        },
      });
    });
  }

  async update(id: string, dto: UpdateListingDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);

    return this.prisma.listing.update({
      where: { id },
      data: {
        location: dto.location,
        propertyType: dto.propertyType,
        finish: dto.finish,
        paymentPlan: dto.paymentPlan,
        listingType: dto.listingType,
        status: dto.status,
        priceNgn: dto.priceNgn,
        priceOutrightNgn: dto.priceOutrightNgn,
        price6mNgn: dto.price6mNgn,
        price12mNgn: dto.price12mNgn,
        price18mNgn: dto.price18mNgn,
        sourceDocument: dto.sourceDocument,
        notes: dto.notes,
        isPublic: dto.isPublic,
      },
    });
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.SALES,
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [UserRole.SALES, UserRole.CEO, UserRole.ADMIN];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only sales or admin can manage listings');
    }
  }
}
