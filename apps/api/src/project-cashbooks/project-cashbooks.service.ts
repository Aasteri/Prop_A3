import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CashbookLineDto,
  CreateCashbookDto,
  UpdateCashbookDto,
} from './dto/cashbook.dto';

const include = {
  project: {
    select: {
      id: true,
      name: true,
      projectNumber: true,
      site: { select: { code: true, name: true } },
    },
  },
  lines: { orderBy: { sn: 'asc' as const } },
};

@Injectable()
export class ProjectCashbooksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.projectCashbook.findMany({
      where: projectId ? { projectId } : undefined,
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.projectCashbook.findUnique({
      where: { id },
      include,
    });
    if (!row) throw new NotFoundException('Cashbook not found');
    return row;
  }

  async create(dto: CreateCashbookDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

    return this.prisma.projectCashbook.create({
      data: {
        number: `CBK-${year}-${stamp}`,
        projectId: dto.projectId,
        projectCode: dto.projectCode ?? project.projectNumber,
        title: dto.title ?? `Expenses & inflow — ${project.name}`,
        notes: dto.notes,
        lines: dto.lines?.length
          ? { create: dto.lines.map((l) => this.mapLine(l)) }
          : undefined,
      },
      include,
    });
  }

  async update(id: string, dto: UpdateCashbookDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      await tx.projectCashbookLine.deleteMany({ where: { cashbookId: id } });
      return tx.projectCashbook.update({
        where: { id },
        data: {
          ...(dto.projectCode !== undefined ? { projectCode: dto.projectCode } : {}),
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          lines: {
            create: dto.lines.map((l) => this.mapLine(l)),
          },
        },
        include,
      });
    });
  }

  private mapLine(l: CashbookLineDto) {
    return {
      sn: l.sn,
      entryDate: l.entryDate ? new Date(l.entryDate) : undefined,
      description: l.description,
      received: l.received != null ? new Prisma.Decimal(l.received) : undefined,
      balanceInAcc:
        l.balanceInAcc != null ? new Prisma.Decimal(l.balanceInAcc) : undefined,
      qty: l.qty != null ? new Prisma.Decimal(l.qty) : undefined,
      unit: l.unit,
      rate: l.rate != null ? new Prisma.Decimal(l.rate) : undefined,
      amount: l.amount != null ? new Prisma.Decimal(l.amount) : undefined,
      total: l.total != null ? new Prisma.Decimal(l.total) : undefined,
      remark: l.remark,
    };
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
      throw new ForbiddenException('Not allowed to view project cashbooks');
    }
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.FINANCE,
    ];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Not allowed to manage project cashbooks');
    }
  }
}
