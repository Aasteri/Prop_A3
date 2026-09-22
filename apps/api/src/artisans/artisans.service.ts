import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ArtisanApprovalStatus,
  ArtisanSource,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateArtisanDto,
  ListArtisansQueryDto,
  PublicArtisanApplyDto,
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
        ...(query.source ? { source: query.source } : {}),
        ...(query.search
          ? {
              OR: [
                { fullName: { contains: query.search } },
                { phone: { contains: query.search } },
                { businessName: { contains: query.search } },
                { email: { contains: query.search } },
              ],
            }
          : {}),
      },
      orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
      },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.artisanProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
      },
    });
    if (!row) throw new NotFoundException('Artisan not found');
    return row;
  }

  /** Admin / CEO / PM / Finance — add roster artisan (often INTERNAL). */
  async create(dto: CreateArtisanDto, user: AuthUser) {
    this.assertCanManage(user);
    const source = dto.source ?? ArtisanSource.INTERNAL;
    const status =
      dto.status ??
      (source === ArtisanSource.INTERNAL
        ? ArtisanApprovalStatus.APPROVED
        : ArtisanApprovalStatus.PENDING_REVIEW);

    let userId: string | undefined;
    if (dto.createLogin) {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('email and password required when createLogin is true');
      }
      userId = await this.createArtisanUser({
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
        phone: dto.phone,
      });
    }

    return this.prisma.artisanProfile.create({
      data: {
        userId,
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
        bio: dto.bio,
        serviceAreas: dto.serviceAreas,
        source,
        status,
        ...(status === ArtisanApprovalStatus.APPROVED
          ? { approvedAt: new Date(), approvedById: user.id }
          : {}),
      },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
      },
    });
  }

  /** Public marketplace artisan signup. */
  async publicApply(dto: PublicArtisanApplyDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const userId = await this.createArtisanUser({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      phone: dto.phone,
      active: false, // inactive until approved
    });

    const profile = await this.prisma.artisanProfile.create({
      data: {
        userId,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email.toLowerCase(),
        businessName: dto.businessName,
        trades: dto.trades ?? [],
        serviceAreas: dto.serviceAreas,
        bio: dto.bio,
        nin: dto.nin,
        bankName: dto.bankName,
        bankAccountName: dto.bankAccountName,
        bankAccountNumber: dto.bankAccountNumber,
        source: ArtisanSource.EXTERNAL,
        status: ArtisanApprovalStatus.PENDING_REVIEW,
      },
    });

    return {
      id: profile.id,
      status: profile.status,
      message:
        'Application received. Triple A Admin will review and approve before you can take jobs.',
    };
  }

  async updateStatus(id: string, dto: UpdateArtisanStatusDto, user: AuthUser) {
    this.assertCanManage(user);
    const row = await this.findOne(id, user);

    const updated = await this.prisma.artisanProfile.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === ArtisanApprovalStatus.APPROVED
          ? { approvedAt: new Date(), approvedById: user.id }
          : {}),
      },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
      },
    });

    if (row.userId) {
      const activate =
        dto.status === ArtisanApprovalStatus.APPROVED
          ? true
          : dto.status === ArtisanApprovalStatus.SUSPENDED ||
              dto.status === ArtisanApprovalStatus.REJECTED
            ? false
            : undefined;
      if (activate !== undefined) {
        await this.prisma.user.update({
          where: { id: row.userId },
          data: { isActive: activate, role: UserRole.ARTISAN },
        });
      }
    }

    return updated;
  }

  async updateLocation(
    id: string,
    dto: { latitude: number; longitude: number },
    user: AuthUser,
  ) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.artisanProfile.update({
      where: { id },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
      },
    });
  }

  private async createArtisanUser(opts: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    active?: boolean;
  }) {
    const email = opts.email.toLowerCase().trim();
    const parts = opts.fullName.trim().split(/\s+/);
    const firstName = parts[0] || 'Artisan';
    const lastName = parts.slice(1).join(' ') || 'User';
    const passwordHash = await bcrypt.hash(opts.password, 10);
    const created = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone: opts.phone,
        role: UserRole.ARTISAN,
        isActive: opts.active ?? true,
      },
    });
    return created.id;
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.FOREMAN,
      UserRole.STORE_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.SALES,
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
