import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateArtisanDto,
  ListArtisansQueryDto,
  UpdateArtisanStatusDto,
} from './dto/artisan.dto';

@Injectable()
export class ArtisansService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, query: ListArtisansQueryDto) {
    this.assertCanView(user);
    return this.prisma.artisanProfile.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { fullName: { contains: query.search } },
                { phone: { contains: query.search } },
                { businessName: { contains: query.search } },
              ],
            }
          : {}),
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.artisanProfile.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Artisan not found');
    return row;
  }

  create(dto: CreateArtisanDto, user: AuthUser) {
    this.assertCanManage(user);
    return this.prisma.artisanProfile.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        businessName: dto.businessName,
        email: dto.email,
        altPhone: dto.altPhone,
        address: dto.address,
        businessAddress: dto.businessAddress,
        nin: dto.nin,
        cacNumber: dto.cacNumber,
        guarantorName: dto.guarantorName,
        guarantorPhone: dto.guarantorPhone,
        guarantorAddress: dto.guarantorAddress,
        bankName: dto.bankName,
        bankAccountName: dto.bankAccountName,
        bankAccountNumber: dto.bankAccountNumber,
        trades: dto.trades ?? [],
        status: 'pending_review',
      },
    });
  }

  async updateStatus(id: string, dto: UpdateArtisanStatusDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.artisanProfile.update({
      where: { id },
      data: { status: dto.status },
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
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
