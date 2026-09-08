import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateTenancyDto,
  ListTenanciesQueryDto,
  UpdateTenancyDto,
} from './dto/tenancy.dto';

const include = {
  property: { select: { id: true, name: true, code: true, address: true } },
  unit: { select: { id: true, unitCode: true, unitType: true } },
};

@Injectable()
export class TenanciesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, query: ListTenanciesQueryDto) {
    this.assertCanView(user);
    return this.prisma.tenancy.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.propertyId ? { propertyId: query.propertyId } : {}),
        ...(query.search
          ? {
              OR: [
                { tenantName: { contains: query.search } },
                { agreementNo: { contains: query.search } },
                { tenantPhone: { contains: query.search } },
              ],
            }
          : {}),
      },
      include,
      orderBy: { endDate: 'asc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.tenancy.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Tenancy not found');
    return row;
  }

  async create(dto: CreateTenancyDto, user: AuthUser) {
    this.assertCanManage(user);
    const property = await this.prisma.propertyAsset.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.tenancy.create({
      data: {
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        agreementNo: dto.agreementNo,
        tenantName: dto.tenantName,
        tenantPhone: dto.tenantPhone,
        tenantEmail: dto.tenantEmail,
        applicationId: dto.applicationId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        rentAnnual: dto.rentAnnual,
        cautionAmount: dto.cautionAmount,
        serviceCharge: dto.serviceCharge,
        status: dto.status ?? 'ACTIVE',
      },
      include,
    });
  }

  async update(id: string, dto: UpdateTenancyDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.tenancy.update({
      where: { id },
      data: {
        tenantName: dto.tenantName,
        tenantPhone: dto.tenantPhone,
        tenantEmail: dto.tenantEmail,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        rentAnnual: dto.rentAnnual,
        cautionAmount: dto.cautionAmount,
        serviceCharge: dto.serviceCharge,
        status: dto.status,
      },
      include,
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
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only PM, Finance, or Admin can manage tenancies');
    }
  }
}
