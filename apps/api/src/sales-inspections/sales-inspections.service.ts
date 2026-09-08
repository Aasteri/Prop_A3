import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SalesInspectionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateSalesInspectionDto,
  LogInspectionResponseDto,
  UpdateSalesInspectionDto,
} from './dto/sales-inspection.dto';

@Injectable()
export class SalesInspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, leadId?: string) {
    this.assertCanView(user);
    return this.prisma.salesInspection.findMany({
      where: leadId ? { leadId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.salesInspection.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Inspection not found');
    return row;
  }

  async create(dto: CreateSalesInspectionDto, user: AuthUser) {
    this.assertCanManage(user);
    if (dto.leadId) {
      const lead = await this.prisma.lead.findUnique({ where: { id: dto.leadId } });
      if (!lead) throw new NotFoundException('Lead not found');
    }
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    return this.prisma.salesInspection.create({
      data: {
        number: `VIN-${year}-${stamp}`,
        leadId: dto.leadId,
        listingId: dto.listingId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        status: dto.scheduledAt ? SalesInspectionStatus.SCHEDULED : SalesInspectionStatus.REQUESTED,
      },
    });
  }

  async update(id: string, dto: UpdateSalesInspectionDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.salesInspection.update({
      where: { id },
      data: {
        status: dto.status,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        occurred: dto.occurred,
        observations: dto.observations,
        buyerFeedback: dto.buyerFeedback,
        interestLevel: dto.interestLevel,
        nextAction: dto.nextAction,
      },
    });
  }

  async logResponse(id: string, dto: LogInspectionResponseDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.salesInspection.update({
      where: { id },
      data: {
        occurred: dto.occurred,
        observations: dto.observations,
        buyerFeedback: dto.buyerFeedback,
        interestLevel: dto.interestLevel,
        nextAction: dto.nextAction,
        responseAt: new Date(),
        status: SalesInspectionStatus.COMPLETED_RESPONSE_LOGGED,
      },
    });
  }

  /** Used by CRM gate */
  async hasCompletedResponse(leadId: string): Promise<boolean> {
    const row = await this.prisma.salesInspection.findFirst({
      where: {
        leadId,
        status: SalesInspectionStatus.COMPLETED_RESPONSE_LOGGED,
        occurred: true,
      },
    });
    return !!row;
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
    this.assertCanView(user);
  }
}
