import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import {
  DailyLogStatus,
  MilestoneStage,
  Prisma,
  UserRole,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateDailyLogDto,
  RejectDailyLogDto,
  SubmitDailyLogDto,
  UpdateDailyLogDto,
} from './dto/daily-log.dto';
import {
  averageProgress,
  canAccessSite,
  generateRefCode,
} from './site-tracker.utils';
import { buildSiteLogPdf } from './site-log.pdf';
import { gateFoundationProgress } from '../milestones/milestones.utils';

const logInclude = {
  project: { include: { site: true } },
  site: true,
  submittedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  approvedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  activities: { orderBy: { sortOrder: 'asc' as const } },
  machinery: { orderBy: { sortOrder: 'asc' as const } },
  materials: { orderBy: { sortOrder: 'asc' as const } },
  supervisors: { orderBy: { sortOrder: 'asc' as const } },
  photos: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class SiteTrackerService {
  private readonly photosDir = path.join(process.cwd(), '..', '..', 'uploads', 'site-logs');

  constructor(private readonly prisma: PrismaService) {
    fs.mkdirSync(this.photosDir, { recursive: true });
  }

  async findAll(user: AuthUser) {
    const allSites =
      user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      !user.siteIds.length;
    const where = allSites ? {} : { siteId: { in: user.siteIds } };

    return this.prisma.dailySiteLog.findMany({
      where,
      include: logInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async findOne(id: string, user: AuthUser) {
    const log = await this.prisma.dailySiteLog.findUnique({
      where: { id },
      include: logInclude,
    });

    if (!log) throw new NotFoundException('Daily log not found');
    if (!canAccessSite(user.siteIds, log.siteId, user.role)) {
      throw new ForbiddenException();
    }

    return this.withMaterialBalances(log);
  }

  async create(dto: CreateDailyLogDto, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: { site: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (!canAccessSite(user.siteIds, project.siteId, user.role)) {
      throw new ForbiddenException();
    }

    const logDate = new Date(dto.date);

    return this.prisma.$transaction(async (tx) => {
      const refCode = await generateRefCode(
        tx,
        project.site.code,
        project.projectNumber,
        logDate,
      );

      const log = await tx.dailySiteLog.create({
        data: {
          projectId: project.id,
          siteId: project.siteId,
          date: logDate,
          refCode,
          startTime: dto.startTime,
          endTime: dto.endTime,
          projectName: dto.projectName,
          projectLocation: dto.projectLocation,
          skilledWorkers: dto.skilledWorkers ?? 0,
          ironBenders: dto.ironBenders ?? 0,
          carpenters: dto.carpenters ?? 0,
          masons: dto.masons ?? 0,
          plumbers: dto.plumbers ?? 0,
          electricians: dto.electricians ?? 0,
          unskilledWorkers: dto.unskilledWorkers ?? 0,
          supervisorsCount: dto.supervisorsCount ?? 0,
          manpowerRemark: dto.manpowerRemark,
          qualitySlumpTest: dto.qualitySlumpTest ?? false,
          qualityCubeCasting: dto.qualityCubeCasting ?? false,
          qualityReinforcement: dto.qualityReinforcement ?? false,
          qualityConcrete: dto.qualityConcrete ?? false,
          qualityOther: dto.qualityOther,
          safetyPpeCompliance: dto.safetyPpeCompliance ?? false,
          safetyToolboxTalk: dto.safetyToolboxTalk ?? false,
          safetyIncidentsNearMisses: dto.safetyIncidentsNearMisses ?? false,
          issueMaterialShortage: dto.issueMaterialShortage ?? false,
          issueEquipmentBreakdown: dto.issueEquipmentBreakdown ?? false,
          issueWeatherDelay: dto.issueWeatherDelay ?? false,
          issueOther: dto.issueOther,
          nextDayActivities: dto.nextDayActivities,
          nextDayMaterials: dto.nextDayMaterials,
          nextDayManpower: dto.nextDayManpower,
          submittedById: user.id,
          supervisors: {
            create: (dto.siteSupervisors ?? []).map((name, i) => ({
              name,
              sortOrder: i,
            })),
          },
          activities: {
            create: (dto.activities ?? []).map((a, i) => ({
              activity: a.activity,
              status: a.status,
              progressPercent: a.progressPercent,
              remark: a.remark,
              sortOrder: i,
            })),
          },
          machinery: {
            create: (dto.machinery ?? []).map((m, i) => ({
              equipment: m.equipment,
              unitsHours: m.unitsHours,
              remark: m.remark,
              sortOrder: i,
            })),
          },
          materials: {
            create: (dto.materials ?? []).map((m, i) => ({
              material: m.material,
              receivedQty: m.receivedQty,
              consumedQty: m.consumedQty,
              remark: m.remark,
              sortOrder: i,
            })),
          },
        },
        include: logInclude,
      });

      return this.withMaterialBalances(log);
    });
  }

  async update(id: string, dto: UpdateDailyLogDto, user: AuthUser) {
    const existing = await this.getEditableLog(id, user);

    if (dto.projectId && dto.projectId !== existing.projectId) {
      throw new BadRequestException('Cannot change project on an existing log');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.dailySiteLogActivity.deleteMany({ where: { logId: id } });
      await tx.dailySiteLogMachinery.deleteMany({ where: { logId: id } });
      await tx.dailySiteLogMaterial.deleteMany({ where: { logId: id } });
      await tx.dailySiteLogSupervisor.deleteMany({ where: { logId: id } });

      const log = await tx.dailySiteLog.update({
        where: { id },
        data: {
          date: dto.date ? new Date(dto.date) : undefined,
          startTime: dto.startTime,
          endTime: dto.endTime,
          projectName: dto.projectName,
          projectLocation: dto.projectLocation,
          skilledWorkers: dto.skilledWorkers,
          ironBenders: dto.ironBenders,
          carpenters: dto.carpenters,
          masons: dto.masons,
          plumbers: dto.plumbers,
          electricians: dto.electricians,
          unskilledWorkers: dto.unskilledWorkers,
          supervisorsCount: dto.supervisorsCount,
          manpowerRemark: dto.manpowerRemark,
          qualitySlumpTest: dto.qualitySlumpTest,
          qualityCubeCasting: dto.qualityCubeCasting,
          qualityReinforcement: dto.qualityReinforcement,
          qualityConcrete: dto.qualityConcrete,
          qualityOther: dto.qualityOther,
          safetyPpeCompliance: dto.safetyPpeCompliance,
          safetyToolboxTalk: dto.safetyToolboxTalk,
          safetyIncidentsNearMisses: dto.safetyIncidentsNearMisses,
          issueMaterialShortage: dto.issueMaterialShortage,
          issueEquipmentBreakdown: dto.issueEquipmentBreakdown,
          issueWeatherDelay: dto.issueWeatherDelay,
          issueOther: dto.issueOther,
          nextDayActivities: dto.nextDayActivities,
          nextDayMaterials: dto.nextDayMaterials,
          nextDayManpower: dto.nextDayManpower,
          supervisors: {
            create: (dto.siteSupervisors ?? []).map((name, i) => ({
              name,
              sortOrder: i,
            })),
          },
          activities: {
            create: (dto.activities ?? []).map((a, i) => ({
              activity: a.activity,
              status: a.status,
              progressPercent: a.progressPercent,
              remark: a.remark,
              sortOrder: i,
            })),
          },
          machinery: {
            create: (dto.machinery ?? []).map((m, i) => ({
              equipment: m.equipment,
              unitsHours: m.unitsHours,
              remark: m.remark,
              sortOrder: i,
            })),
          },
          materials: {
            create: (dto.materials ?? []).map((m, i) => ({
              material: m.material,
              receivedQty: m.receivedQty,
              consumedQty: m.consumedQty,
              remark: m.remark,
              sortOrder: i,
            })),
          },
        },
        include: logInclude,
      });

      return this.withMaterialBalances(log);
    });
  }

  async submit(id: string, dto: SubmitDailyLogDto, user: AuthUser) {
    const existing = await this.getEditableLog(id, user);

    if (!dto.supervisorSignature?.trim()) {
      throw new BadRequestException('Supervisor signature is required');
    }

    const log = await this.prisma.dailySiteLog.update({
      where: { id },
      data: {
        status: DailyLogStatus.SUBMITTED,
        supervisorSignature: dto.supervisorSignature,
        supervisorSignedAt: new Date(),
        submittedById: user.id,
        submittedAt: new Date(),
        submitLat: dto.submitLat,
        submitLng: dto.submitLng,
      },
      include: logInclude,
    });

    return this.withMaterialBalances(log);
  }

  async approve(id: string, user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM or CEO can approve logs');
    }

    const log = await this.prisma.dailySiteLog.findUnique({
      where: { id },
      include: { activities: true, project: true },
    });

    if (!log) throw new NotFoundException('Daily log not found');
    if (!canAccessSite(user.siteIds, log.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (log.status !== DailyLogStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted logs can be approved');
    }

    const progress = averageProgress(log.activities);

    const updated = await this.prisma.$transaction(async (tx) => {
      const approved = await tx.dailySiteLog.update({
        where: { id },
        data: {
          status: DailyLogStatus.APPROVED,
          approvedById: user.id,
          approvedAt: new Date(),
          pmSignedAt: new Date(),
        },
        include: logInclude,
      });

      const foundation = await tx.milestone.findUnique({
        where: {
          projectId_stage: {
            projectId: log.projectId,
            stage: MilestoneStage.FOUNDATION,
          },
        },
      });

      if (foundation) {
        const rawPct = Number(foundation.progressPct) + progress * 0.1;
        const newPct = gateFoundationProgress(
          MilestoneStage.FOUNDATION,
          rawPct,
          !!log.project.fcdaPermitUrl,
        );
        await tx.milestone.update({
          where: { id: foundation.id },
          data: {
            progressPct: newPct,
            completedAt: newPct >= 100 ? new Date() : null,
          },
        });
      }

      return approved;
    });

    return this.withMaterialBalances(updated);
  }

  async reject(id: string, dto: RejectDailyLogDto, user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM or CEO can reject logs');
    }

    const log = await this.prisma.dailySiteLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Daily log not found');
    if (!canAccessSite(user.siteIds, log.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (log.status !== DailyLogStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted logs can be rejected');
    }

    const updated = await this.prisma.dailySiteLog.update({
      where: { id },
      data: {
        status: DailyLogStatus.REJECTED,
        rejectReason: dto.rejectReason,
        approvedById: user.id,
        approvedAt: new Date(),
      },
      include: logInclude,
    });

    return this.withMaterialBalances(updated);
  }

  async uploadPhotos(
    id: string,
    files: Express.Multer.File[],
    section: string | undefined,
    lat: number | undefined,
    lng: number | undefined,
    user: AuthUser,
  ) {
    const log = await this.getEditableLog(id, user);
    if (!files?.length) {
      throw new BadRequestException('At least one photo is required');
    }

    const existingCount = await this.prisma.dailySiteLogPhoto.count({
      where: { logId: id },
    });

    const created = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = `${Date.now()}-${i}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(this.photosDir, filename), file.buffer);
      const photo = await this.prisma.dailySiteLogPhoto.create({
        data: {
          logId: id,
          url: `/uploads/site-logs/${filename}`,
          filename,
          section: section ?? 'general',
          lat,
          lng,
          takenAt: new Date(),
          sortOrder: existingCount + i,
        },
      });
      created.push(photo);
    }

    const full = await this.prisma.dailySiteLog.findUnique({
      where: { id: log.id },
      include: logInclude,
    });
    return this.withMaterialBalances(full!);
  }

  async exportPdf(id: string, user: AuthUser): Promise<StreamableFile> {
    const log = await this.prisma.dailySiteLog.findUnique({
      where: { id },
      include: { ...logInclude, site: true },
    });
    if (!log) throw new NotFoundException('Daily log not found');
    if (!canAccessSite(user.siteIds, log.siteId, user.role)) {
      throw new ForbiddenException();
    }

    const withBalances = this.withMaterialBalances(log);
    const buffer = await buildSiteLogPdf({
      refCode: log.refCode,
      date: log.date,
      projectName: log.projectName,
      projectLocation: log.projectLocation,
      startTime: log.startTime,
      endTime: log.endTime,
      status: log.status,
      siteCode: log.site.code,
      activities: log.activities.map((a) => ({
        activity: a.activity,
        status: a.status,
        progressPercent: a.progressPercent,
      })),
      ironBenders: log.ironBenders,
      carpenters: log.carpenters,
      masons: log.masons,
      materials: withBalances.materials.map((m) => ({
        material: m.material,
        receivedQty: Number(m.receivedQty),
        consumedQty: Number(m.consumedQty),
        balance: Number(m.receivedQty) - Number(m.consumedQty),
      })),
      qualitySlumpTest: log.qualitySlumpTest,
      safetyPpeCompliance: log.safetyPpeCompliance,
      supervisorSignature: log.supervisorSignature,
      nextDayActivities: log.nextDayActivities,
    });

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${log.refCode.replace(/\//g, '-')}.pdf"`,
    });
  }

  private async getEditableLog(id: string, user: AuthUser) {
    const log = await this.prisma.dailySiteLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Daily log not found');
    if (!canAccessSite(user.siteIds, log.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (
      log.status !== DailyLogStatus.DRAFT &&
      log.status !== DailyLogStatus.REJECTED
    ) {
      throw new BadRequestException('Log cannot be edited in current status');
    }
    return log;
  }

  private withMaterialBalances<T extends { materials: { receivedQty: Prisma.Decimal; consumedQty: Prisma.Decimal; [key: string]: unknown }[] }>(
    log: T,
  ) {
    return {
      ...log,
      materials: log.materials.map((m) => ({
        ...m,
        balance: Number(m.receivedQty) - Number(m.consumedQty),
      })),
    };
  }
}
