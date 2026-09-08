import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreatePropertyDto,
  ListPropertiesQueryDto,
  UpdatePropertyDto,
} from './dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, query: ListPropertiesQueryDto) {
    this.assertCanView(user);
    return this.prisma.propertyAsset.findMany({
      where: {
        ...(query.category ? { category: query.category } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search } },
                { address: { contains: query.search } },
                { code: { contains: query.search } },
                { estateName: { contains: query.search } },
              ],
            }
          : {}),
      },
      include: {
        units: { where: { isActive: true }, orderBy: { unitCode: 'asc' } },
        _count: { select: { tenancies: true, maintenanceRequests: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const property = await this.prisma.propertyAsset.findUnique({
      where: { id },
      include: {
        units: { orderBy: { unitCode: 'asc' } },
        tenancies: { orderBy: { startDate: 'desc' }, take: 20 },
        maintenanceRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
        serviceChargeAccount: true,
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(dto: CreatePropertyDto, user: AuthUser) {
    this.assertCanManage(user);
    return this.prisma.propertyAsset.create({
      data: {
        code: dto.code,
        name: dto.name,
        address: dto.address,
        category: dto.category,
        occupancyKind: dto.occupancyKind,
        titleType: dto.titleType,
        density: dto.density,
        estateName: dto.estateName,
        neighbourhood: dto.neighbourhood,
        landlordName: dto.landlordName,
        landlordPhone: dto.landlordPhone,
        notes: dto.notes,
        units: dto.unitCode
          ? {
              create: {
                unitCode: dto.unitCode,
                unitType: dto.unitType,
                bedrooms: dto.bedrooms,
              },
            }
          : undefined,
        serviceChargeAccount: { create: {} },
      },
      include: { units: true, serviceChargeAccount: true },
    });
  }

  async update(id: string, dto: UpdatePropertyDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.propertyAsset.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        category: dto.category,
        occupancyKind: dto.occupancyKind,
        titleType: dto.titleType,
        density: dto.density,
        estateName: dto.estateName,
        neighbourhood: dto.neighbourhood,
        landlordName: dto.landlordName,
        landlordPhone: dto.landlordPhone,
        notes: dto.notes,
      },
      include: { units: true },
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
      throw new ForbiddenException('Only PM, Finance, or Admin can manage properties');
    }
  }
}
