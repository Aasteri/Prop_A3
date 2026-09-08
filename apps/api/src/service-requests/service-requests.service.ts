import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceRequestStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  AssignArtisanDto,
  ConfirmServiceRequestDto,
  CreateServiceRequestDto,
  EstimateServiceRequestDto,
} from './dto/service-request.dto';

const include = {
  artisan: {
    select: { id: true, fullName: true, phone: true, trades: true, status: true, avgRating: true },
  },
};

/** Services fee: 2.5% of labour only (materials excluded). */
export function calcServicesFee(labour: number): number {
  return Math.round(labour * 0.025 * 100) / 100;
}

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.serviceRequest.findMany({
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.serviceRequest.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Service request not found');
    return row;
  }

  async create(dto: CreateServiceRequestDto, user: AuthUser) {
    this.assertCanManage(user);
    if (!dto.photoUrls?.length) {
      throw new BadRequestException('At least one photo URL is required');
    }
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const stamp = Date.now().toString(36).toUpperCase().slice(-4);
    return this.prisma.serviceRequest.create({
      data: {
        number: `SRQ-${year}${month}-${stamp}`,
        tradeCode: dto.tradeCode,
        description: dto.description,
        component: dto.component,
        workRequired: dto.workRequired,
        photoUrls: dto.photoUrls,
        propertyId: dto.propertyId,
        projectId: dto.projectId,
        maintenanceId: dto.maintenanceId,
        status: ServiceRequestStatus.SUBMITTED,
      },
      include,
    });
  }

  async assign(id: string, dto: AssignArtisanDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    const artisan = await this.prisma.artisanProfile.findUnique({ where: { id: dto.artisanId } });
    if (!artisan) throw new NotFoundException('Artisan not found');
    if (artisan.status !== 'approved' && artisan.status !== 'active') {
      throw new BadRequestException('Artisan must be approved before assignment');
    }
    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        artisanId: dto.artisanId,
        status: ServiceRequestStatus.ARTISAN_SELECTED,
      },
      include,
    });
  }

  async estimate(id: string, dto: EstimateServiceRequestDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (!existing.artisanId) {
      throw new BadRequestException('Assign an artisan before estimate');
    }
    const platformFee = calcServicesFee(dto.labourAmount);
    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        labourAmount: dto.labourAmount,
        materialsAmount: dto.materialsAmount ?? 0,
        platformFee,
        status: ServiceRequestStatus.ESTIMATED,
      },
      include,
    });
  }

  async approve(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== ServiceRequestStatus.ESTIMATED) {
      throw new BadRequestException('Only estimated requests can be approved');
    }
    return this.prisma.serviceRequest.update({
      where: { id },
      data: { status: ServiceRequestStatus.APPROVED },
      include,
    });
  }

  async start(id: string, user: AuthUser) {
    this.assertCanManage(user);
    return this.prisma.serviceRequest.update({
      where: { id },
      data: { status: ServiceRequestStatus.IN_PROGRESS },
      include,
    });
  }

  async confirm(id: string, dto: ConfirmServiceRequestDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        tenantSatisfied: dto.tenantSatisfied,
        tenantRating: dto.tenantRating,
        status: ServiceRequestStatus.CLOSED,
      },
      include,
    });
    if (existing.artisanId && dto.tenantRating) {
      const artisan = await this.prisma.artisanProfile.findUnique({
        where: { id: existing.artisanId },
      });
      if (artisan) {
        const prevJobs = artisan.jobsCompleted;
        const prevAvg = Number(artisan.avgRating ?? 0);
        const nextAvg =
          prevJobs === 0
            ? dto.tenantRating
            : Math.round(((prevAvg * prevJobs + dto.tenantRating) / (prevJobs + 1)) * 100) / 100;
        await this.prisma.artisanProfile.update({
          where: { id: artisan.id },
          data: {
            jobsCompleted: { increment: 1 },
            avgRating: nextAvg,
          },
        });
      }
    }
    return updated;
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.FOREMAN,
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
