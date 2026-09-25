import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  BulkWorkTasksDto,
  CreateLabourScheduleDto,
  CreatePlantEquipmentScheduleDto,
  CreateWorkTaskDto,
  LabourScheduleLineDto,
  PlantEquipmentLineDto,
  UpdateLabourScheduleDto,
  UpdatePlantEquipmentScheduleDto,
  UpdateWorkTaskDto,
} from './dto/schedules.dto';

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true,
      location: true,
      site: { select: { code: true, name: true } },
    },
  },
};

const scheduleInclude = {
  project: {
    select: {
      id: true,
      name: true,
      location: true,
      site: { select: { code: true, name: true } },
    },
  },
  lines: { orderBy: { sn: 'asc' as const } },
};

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Work schedule tasks (Sheet 1 / WBS) ──────────────────────────

  findWorkTasks(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.workScheduleTask.findMany({
      where: projectId ? { projectId } : undefined,
      include: taskInclude,
      orderBy: [{ sortOrder: 'asc' }, { wbsNumber: 'asc' }],
    });
  }

  async createWorkTask(dto: CreateWorkTaskDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.requireProject(dto.projectId);
    return this.prisma.workScheduleTask.create({
      data: this.mapWorkTaskData(dto),
      include: taskInclude,
    });
  }

  async updateWorkTask(id: string, dto: UpdateWorkTaskDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.requireWorkTask(id);
    return this.prisma.workScheduleTask.update({
      where: { id },
      data: {
        ...(dto.wbsNumber !== undefined ? { wbsNumber: dto.wbsNumber } : {}),
        ...(dto.taskTitle !== undefined ? { taskTitle: dto.taskTitle } : {}),
        ...(dto.taskOwner !== undefined ? { taskOwner: dto.taskOwner } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
        ...(dto.durationDays !== undefined ? { durationDays: dto.durationDays } : {}),
        ...(dto.dailyHours !== undefined
          ? { dailyHours: dto.dailyHours != null ? new Prisma.Decimal(dto.dailyHours) : null }
          : {}),
        ...(dto.progressPct !== undefined
          ? { progressPct: new Prisma.Decimal(dto.progressPct) }
          : {}),
        ...(dto.isPaymentMilestone !== undefined
          ? { isPaymentMilestone: dto.isPaymentMilestone }
          : {}),
        ...(dto.sprintGoal !== undefined ? { sprintGoal: dto.sprintGoal } : {}),
        ...(dto.phaseLabel !== undefined ? { phaseLabel: dto.phaseLabel } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
      include: taskInclude,
    });
  }

  async deleteWorkTask(id: string, user: AuthUser) {
    this.assertCanManage(user);
    await this.requireWorkTask(id);
    await this.prisma.workScheduleTask.delete({ where: { id } });
    return { ok: true };
  }

  async bulkCreateWorkTasks(dto: BulkWorkTasksDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.requireProject(dto.projectId);

    const data = dto.tasks.map((t, i) =>
      this.mapWorkTaskData({
        ...t,
        projectId: dto.projectId,
        sortOrder: t.sortOrder ?? i,
      }),
    );

    await this.prisma.workScheduleTask.createMany({ data });
    return this.findWorkTasks(user, dto.projectId);
  }

  // ── Labour schedules (Sheet 5) ───────────────────────────────────

  findLabourSchedules(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.labourSchedule.findMany({
      where: projectId ? { projectId } : undefined,
      include: scheduleInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLabourSchedule(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.labourSchedule.findUnique({
      where: { id },
      include: scheduleInclude,
    });
    if (!row) throw new NotFoundException('Labour schedule not found');
    return row;
  }

  async createLabourSchedule(dto: CreateLabourScheduleDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.requireProject(dto.projectId);

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

    return this.prisma.labourSchedule.create({
      data: {
        number: `LAB-${year}-${stamp}`,
        projectId: dto.projectId,
        projectTitle: dto.projectTitle ?? project.name,
        projectPhase: dto.projectPhase,
        projectManager:
          dto.projectManager ?? `${user.firstName} ${user.lastName}`.trim(),
        sheetNo: dto.sheetNo,
        scheduleDate: dto.scheduleDate ? new Date(dto.scheduleDate) : undefined,
        notes: dto.notes,
        lines: dto.lines?.length
          ? { create: dto.lines.map((l) => this.mapLineData(l)) }
          : undefined,
      },
      include: scheduleInclude,
    });
  }

  async updateLabourSchedule(id: string, dto: UpdateLabourScheduleDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findLabourSchedule(id, user);

    return this.prisma.$transaction(async (tx) => {
      await tx.labourScheduleLine.deleteMany({ where: { scheduleId: id } });
      return tx.labourSchedule.update({
        where: { id },
        data: {
          ...(dto.projectTitle !== undefined ? { projectTitle: dto.projectTitle } : {}),
          ...(dto.projectPhase !== undefined ? { projectPhase: dto.projectPhase } : {}),
          ...(dto.projectManager !== undefined
            ? { projectManager: dto.projectManager }
            : {}),
          ...(dto.sheetNo !== undefined ? { sheetNo: dto.sheetNo } : {}),
          ...(dto.scheduleDate !== undefined
            ? { scheduleDate: dto.scheduleDate ? new Date(dto.scheduleDate) : null }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          lines: {
            create: dto.lines.map((l) => this.mapLineData(l)),
          },
        },
        include: scheduleInclude,
      });
    });
  }

  // ── Plant & equipment schedules (Abraham paper form) ─────────────

  findPlantEquipmentSchedules(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.plantEquipmentSchedule.findMany({
      where: projectId ? { projectId } : undefined,
      include: scheduleInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPlantEquipmentSchedule(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.plantEquipmentSchedule.findUnique({
      where: { id },
      include: scheduleInclude,
    });
    if (!row) throw new NotFoundException('Plant & equipment schedule not found');
    return row;
  }

  async createPlantEquipmentSchedule(dto: CreatePlantEquipmentScheduleDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.requireProject(dto.projectId);
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

    return this.prisma.plantEquipmentSchedule.create({
      data: {
        number: `PEQ-${year}-${stamp}`,
        projectId: dto.projectId,
        projectTitle: dto.projectTitle ?? project.name,
        projectPhase: dto.projectPhase,
        projectManager:
          dto.projectManager ?? `${user.firstName} ${user.lastName}`.trim(),
        sheetNo: dto.sheetNo,
        scheduleDate: dto.scheduleDate ? new Date(dto.scheduleDate) : undefined,
        notes: dto.notes,
        lines: dto.lines?.length
          ? { create: dto.lines.map((l) => this.mapPlantLineData(l)) }
          : undefined,
      },
      include: scheduleInclude,
    });
  }

  async updatePlantEquipmentSchedule(
    id: string,
    dto: UpdatePlantEquipmentScheduleDto,
    user: AuthUser,
  ) {
    this.assertCanManage(user);
    await this.findPlantEquipmentSchedule(id, user);

    return this.prisma.$transaction(async (tx) => {
      await tx.plantEquipmentScheduleLine.deleteMany({ where: { scheduleId: id } });
      return tx.plantEquipmentSchedule.update({
        where: { id },
        data: {
          ...(dto.projectTitle !== undefined ? { projectTitle: dto.projectTitle } : {}),
          ...(dto.projectPhase !== undefined ? { projectPhase: dto.projectPhase } : {}),
          ...(dto.projectManager !== undefined
            ? { projectManager: dto.projectManager }
            : {}),
          ...(dto.sheetNo !== undefined ? { sheetNo: dto.sheetNo } : {}),
          ...(dto.scheduleDate !== undefined
            ? { scheduleDate: dto.scheduleDate ? new Date(dto.scheduleDate) : null }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          lines: {
            create: dto.lines.map((l) => this.mapPlantLineData(l)),
          },
        },
        include: scheduleInclude,
      });
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private mapWorkTaskData(dto: CreateWorkTaskDto) {
    return {
      projectId: dto.projectId,
      wbsNumber: dto.wbsNumber,
      taskTitle: dto.taskTitle,
      taskOwner: dto.taskOwner,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      durationDays: dto.durationDays,
      dailyHours:
        dto.dailyHours != null ? new Prisma.Decimal(dto.dailyHours) : undefined,
      progressPct: new Prisma.Decimal(dto.progressPct ?? 0),
      isPaymentMilestone: dto.isPaymentMilestone ?? false,
      sprintGoal: dto.sprintGoal,
      phaseLabel: dto.phaseLabel,
      notes: dto.notes,
      sortOrder: dto.sortOrder ?? 0,
    };
  }

  private mapLineData(l: LabourScheduleLineDto) {
    return {
      sn: l.sn,
      description: l.description,
      teamTrade: l.teamTrade,
      gangLeader: l.gangLeader,
      gangSize: l.gangSize,
      workStart: l.workStart ? new Date(l.workStart) : undefined,
      workEnd: l.workEnd ? new Date(l.workEnd) : undefined,
      costPerUnit:
        l.costPerUnit != null ? new Prisma.Decimal(l.costPerUnit) : undefined,
      costUnit: l.costUnit,
      totalAmount:
        l.totalAmount != null ? new Prisma.Decimal(l.totalAmount) : undefined,
      supervisedBy: l.supervisedBy,
      remark: l.remark,
    };
  }

  private mapPlantLineData(l: PlantEquipmentLineDto) {
    return {
      sn: l.sn,
      description: l.description,
      nameSource: l.nameSource,
      startDate: l.startDate ? new Date(l.startDate) : undefined,
      startTime: l.startTime,
      endTime: l.endTime,
      qtyUsed: l.qtyUsed != null ? new Prisma.Decimal(l.qtyUsed) : undefined,
      costPerUnit:
        l.costPerUnit != null ? new Prisma.Decimal(l.costPerUnit) : undefined,
      costUnit: l.costUnit,
      totalAmount:
        l.totalAmount != null ? new Prisma.Decimal(l.totalAmount) : undefined,
      supervisedBy: l.supervisedBy,
      remark: l.remark,
    };
  }

  private async requireProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async requireWorkTask(id: string) {
    const row = await this.prisma.workScheduleTask.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Work schedule task not found');
    return row;
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.FOREMAN,
      UserRole.ENGINEER,
      UserRole.FINANCE,
    ];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Not allowed to view schedules');
    }
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Not allowed to manage schedules');
    }
  }

  async exportWorkTasksCsv(user: AuthUser, projectId?: string) {
    const tasks = await this.findWorkTasks(user, projectId);
    const header =
      'wbsNumber,taskTitle,taskOwner,startDate,dueDate,progressPct,isPaymentMilestone,project';
    const rows = tasks.map((t) =>
      [
        t.wbsNumber,
        `"${(t.taskTitle ?? '').replace(/"/g, '""')}"`,
        t.taskOwner ?? '',
        t.startDate?.toISOString().slice(0, 10) ?? '',
        t.dueDate?.toISOString().slice(0, 10) ?? '',
        Number(t.progressPct ?? 0),
        t.isPaymentMilestone ? 'yes' : 'no',
        `"${t.project.name.replace(/"/g, '""')}"`,
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }
}
