import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MaterialRequestStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  ApproveMaterialRequestDto,
  CreateMaterialRequestDto,
  IssueMaterialRequestDto,
  RejectMaterialRequestDto,
  UpdateMaterialRequestDto,
} from './dto/material-request.dto';
import { canAccessSite, generateRequestRef } from './material-requests.utils';

const include = {
  project: { include: { site: true } },
  site: true,
  dailyLog: { select: { id: true, refCode: true, date: true } },
  requestedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  approvedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  issuedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  lines: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class MaterialRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, projectId?: string) {
    const allSites =
      user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      !user.siteIds.length;

    return this.prisma.materialRequest.findMany({
      where: {
        ...(allSites ? {} : { siteId: { in: user.siteIds } }),
        ...(projectId ? { projectId } : {}),
      },
      include,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string, user: AuthUser) {
    const req = await this.prisma.materialRequest.findUnique({
      where: { id },
      include,
    });
    if (!req) throw new NotFoundException('Material request not found');
    if (!canAccessSite(user.siteIds, req.siteId, user.role)) {
      throw new ForbiddenException();
    }
    return req;
  }

  async create(dto: CreateMaterialRequestDto, user: AuthUser) {
    if (
      user.role !== UserRole.FOREMAN &&
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.ENGINEER
    ) {
      throw new ForbiddenException('Only site staff can create material requests');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: { site: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (!canAccessSite(user.siteIds, project.siteId, user.role)) {
      throw new ForbiddenException();
    }

    if (!dto.lines?.length) {
      throw new BadRequestException('At least one material line is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const requestRef = await generateRequestRef(tx, project.site.code);
      return tx.materialRequest.create({
        data: {
          projectId: project.id,
          siteId: project.siteId,
          dailyLogId: dto.dailyLogId,
          requestRef,
          area: dto.area,
          requiredDate: new Date(dto.requiredDate),
          notes: dto.notes,
          requestedById: user.id,
          lines: {
            create: dto.lines.map((line, i) => ({
              material: line.material,
              specification: line.specification,
              quantityRequested: line.quantityRequested,
              unit: line.unit,
              urgency: line.urgency ?? 'NORMAL',
              remark: line.remark,
              sortOrder: i,
            })),
          },
        },
        include,
      });
    });
  }

  async update(id: string, dto: UpdateMaterialRequestDto, user: AuthUser) {
    const existing = await this.getEditable(id, user);

    if (dto.projectId && dto.projectId !== existing.projectId) {
      throw new BadRequestException('Cannot change project on existing request');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.materialRequestLine.deleteMany({ where: { requestId: id } });
      return tx.materialRequest.update({
        where: { id },
        data: {
          dailyLogId: dto.dailyLogId,
          area: dto.area,
          requiredDate: new Date(dto.requiredDate),
          notes: dto.notes,
          lines: {
            create: dto.lines.map((line, i) => ({
              material: line.material,
              specification: line.specification,
              quantityRequested: line.quantityRequested,
              unit: line.unit,
              urgency: line.urgency ?? 'NORMAL',
              remark: line.remark,
              sortOrder: i,
            })),
          },
        },
        include,
      });
    });
  }

  async submit(id: string, user: AuthUser) {
    const existing = await this.getEditable(id, user);

    return this.prisma.materialRequest.update({
      where: { id },
      data: { status: MaterialRequestStatus.PENDING_APPROVAL },
      include,
    });
  }

  async approve(id: string, dto: ApproveMaterialRequestDto, user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM can approve material requests');
    }

    const req = await this.prisma.materialRequest.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!req) throw new NotFoundException('Material request not found');
    if (!canAccessSite(user.siteIds, req.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (req.status !== MaterialRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    await this.prisma.$transaction(
      dto.lines.map((line) =>
        this.prisma.materialRequestLine.update({
          where: { id: line.lineId },
          data: { quantityApproved: line.quantityApproved },
        }),
      ),
    );

    return this.prisma.materialRequest.update({
      where: { id },
      data: {
        status: MaterialRequestStatus.APPROVED,
        approvedById: user.id,
        approvedAt: new Date(),
      },
      include,
    });
  }

  async reject(id: string, dto: RejectMaterialRequestDto, user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM can reject material requests');
    }

    const req = await this.prisma.materialRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Material request not found');
    if (!canAccessSite(user.siteIds, req.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (req.status !== MaterialRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    return this.prisma.materialRequest.update({
      where: { id },
      data: {
        status: MaterialRequestStatus.REJECTED,
        rejectReason: dto.rejectReason,
        approvedById: user.id,
        approvedAt: new Date(),
      },
      include,
    });
  }

  async issue(id: string, dto: IssueMaterialRequestDto, user: AuthUser) {
    if (
      user.role !== UserRole.STORE_MANAGER &&
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only store manager or PM can issue materials');
    }

    const req = await this.prisma.materialRequest.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!req) throw new NotFoundException('Material request not found');
    if (!canAccessSite(user.siteIds, req.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (req.status !== MaterialRequestStatus.APPROVED &&
        req.status !== MaterialRequestStatus.PARTIALLY_ISSUED) {
      throw new BadRequestException(
        'Cannot issue materials without PM approval (Charter rule #6)',
      );
    }

    for (const line of dto.lines) {
      const dbLine = req.lines.find((l) => l.id === line.lineId);
      if (!dbLine) throw new BadRequestException(`Line ${line.lineId} not found`);
      const maxApproved = Number(dbLine.quantityApproved ?? dbLine.quantityRequested);
      if (line.quantityIssued > maxApproved) {
        throw new BadRequestException(
          `Cannot issue more than approved qty for ${dbLine.material}`,
        );
      }
    }

    await this.prisma.$transaction(
      dto.lines.map((line) =>
        this.prisma.materialRequestLine.update({
          where: { id: line.lineId },
          data: { quantityIssued: line.quantityIssued },
        }),
      ),
    );

    const updated = await this.prisma.materialRequest.findUnique({
      where: { id },
      include: { lines: true },
    });

    const allIssued = updated!.lines.every(
      (l) => Number(l.quantityIssued) >= Number(l.quantityApproved ?? l.quantityRequested),
    );
    const anyIssued = updated!.lines.some((l) => Number(l.quantityIssued) > 0);

    return this.prisma.materialRequest.update({
      where: { id },
      data: {
        status: allIssued
          ? MaterialRequestStatus.ISSUED
          : anyIssued
            ? MaterialRequestStatus.PARTIALLY_ISSUED
            : MaterialRequestStatus.APPROVED,
        issuedById: user.id,
        issuedAt: new Date(),
      },
      include,
    });
  }

  private async getEditable(id: string, user: AuthUser) {
    const req = await this.prisma.materialRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Material request not found');
    if (!canAccessSite(user.siteIds, req.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (
      req.status !== MaterialRequestStatus.DRAFT &&
      req.status !== MaterialRequestStatus.REJECTED
    ) {
      throw new BadRequestException('Request cannot be edited in current status');
    }
    return req;
  }
}
