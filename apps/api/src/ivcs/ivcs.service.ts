import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IvcStatus, NotificationType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateIvcDto, SignIvcDto, UpdateIvcDto } from './dto/ivc.dto';

export const DEFAULT_IVC_STAGES = [
  {
    sn: 0,
    stage: 'Mobilization fee',
    measuredPct: null,
    amountPaid: null,
    pctPaid: null,
    datePaid: null,
    performanceComment: '',
  },
  {
    sn: 1,
    stage: '1st milestone',
    measuredPct: null,
    amountPaid: null,
    pctPaid: null,
    datePaid: null,
    performanceComment: '',
  },
  {
    sn: 2,
    stage: '2nd milestone',
    measuredPct: null,
    amountPaid: null,
    pctPaid: null,
    datePaid: null,
    performanceComment: '',
  },
  {
    sn: 3,
    stage: '3rd milestone',
    measuredPct: null,
    amountPaid: null,
    pctPaid: null,
    datePaid: null,
    performanceComment: '',
  },
  {
    sn: 4,
    stage: '4th milestone',
    measuredPct: null,
    amountPaid: null,
    pctPaid: null,
    datePaid: null,
    performanceComment: '',
  },
  {
    sn: 5,
    stage: '5th milestone',
    measuredPct: null,
    amountPaid: null,
    pctPaid: null,
    datePaid: null,
    performanceComment: '',
  },
];

const include = {
  project: {
    select: {
      id: true,
      name: true,
      location: true,
      status: true,
      site: { select: { code: true, name: true } },
    },
  },
  worksContract: {
    select: { id: true, number: true, contractSum: true, platformFeePct: true },
  },
};

@Injectable()
export class IvcsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  defaultStages() {
    return DEFAULT_IVC_STAGES;
  }

  findAll(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.interimValuationCertificate.findMany({
      where: projectId ? { projectId } : undefined,
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.interimValuationCertificate.findUnique({
      where: { id },
      include,
    });
    if (!row) throw new NotFoundException('IVC not found');
    return row;
  }

  async create(dto: CreateIvcDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    let subcontractorName = dto.subcontractorName;
    let contractAmount = dto.contractAmount;
    let scopeOfWork = dto.scopeOfWork;
    let contractReference = dto.contractReference;
    let startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    let endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    if (dto.worksContractId) {
      const wc = await this.prisma.worksContract.findUnique({
        where: { id: dto.worksContractId },
      });
      if (!wc) throw new NotFoundException('Works contract not found');
      if (wc.projectId !== dto.projectId) {
        throw new BadRequestException('Works contract belongs to another project');
      }
      subcontractorName = dto.subcontractorName || wc.subcontractorName;
      contractAmount = dto.contractAmount ?? Number(wc.contractSum);
      scopeOfWork = dto.scopeOfWork || wc.scopeSummary;
      contractReference = dto.contractReference || wc.number;
      startDate = startDate ?? (wc.startDate ?? undefined);
      endDate = endDate ?? (wc.completionDate ?? undefined);
    }

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    const stages = dto.stages?.length ? dto.stages : DEFAULT_IVC_STAGES;

    return this.prisma.interimValuationCertificate.create({
      data: {
        number: `IVC-${year}-${stamp}`,
        projectId: dto.projectId,
        worksContractId: dto.worksContractId,
        workDescription: dto.workDescription,
        subcontractorName,
        accountDetails: dto.accountDetails,
        scopeOfWork,
        contractReference,
        contractAmount,
        deliveryPeriod: dto.deliveryPeriod,
        startDate,
        endDate,
        stagesJson: stages as unknown as Prisma.InputJsonValue,
        recommendation: dto.recommendation,
        preparedBy: dto.preparedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        notes: dto.notes,
        status: IvcStatus.DRAFT,
      },
      include,
    });
  }

  async update(id: string, dto: UpdateIvcDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status === IvcStatus.APPROVED) {
      throw new BadRequestException('Approved IVCs cannot be edited');
    }
    return this.prisma.interimValuationCertificate.update({
      where: { id },
      data: {
        workDescription: dto.workDescription,
        subcontractorName: dto.subcontractorName,
        accountDetails: dto.accountDetails,
        scopeOfWork: dto.scopeOfWork,
        contractReference: dto.contractReference,
        contractAmount: dto.contractAmount,
        deliveryPeriod: dto.deliveryPeriod,
        startDate:
          dto.startDate === undefined
            ? undefined
            : dto.startDate
              ? new Date(dto.startDate)
              : null,
        endDate:
          dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
        stagesJson:
          dto.stages === undefined
            ? undefined
            : (dto.stages as unknown as Prisma.InputJsonValue),
        recommendation: dto.recommendation,
        preparedBy: dto.preparedBy,
        notes: dto.notes,
      },
      include,
    });
  }

  async submit(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== IvcStatus.DRAFT) {
      throw new BadRequestException('Only draft IVCs can be submitted');
    }
    const stages = (existing.stagesJson as { measuredPct?: number | null }[]) ?? [];
    const hasMeasurement = stages.some((s) => s.measuredPct != null && Number(s.measuredPct) > 0);
    const hasMobilPaid = stages.some(
      (s, i) => i === 0 && (s as { amountPaid?: number | null }).amountPaid != null,
    );
    if (!hasMeasurement && !hasMobilPaid) {
      throw new BadRequestException(
        'Record measured % (or mobilisation amount) before submit (US-MON-06)',
      );
    }

    const updated = await this.prisma.interimValuationCertificate.update({
      where: { id },
      data: { status: IvcStatus.SUBMITTED, submittedAt: new Date() },
      include,
    });

    const finance = await this.notifications.financeUserIds();
    const recipients = [
      ...finance,
      ...(await this.notifications.ceoUserIds()),
    ].filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PROJECT_IVC,
        title: `IVC submitted — ${updated.number}`,
        body: `${updated.project.name} · ${updated.subcontractorName} · NGN ${Number(
          updated.contractAmount,
        ).toLocaleString('en-NG')}`,
        linkUrl: '/ivcs',
      });
    }
    return updated;
  }

  async signPm(id: string, dto: SignIvcDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status === IvcStatus.DRAFT) {
      throw new BadRequestException('Submit IVC before PM sign-off');
    }
    await this.prisma.interimValuationCertificate.update({
      where: { id },
      data: {
        pmSignedAt: new Date(),
        pmSignedBy: dto.signedBy ?? `${user.firstName} ${user.lastName}`.trim(),
      },
    });
    return this.finalizeIfSigned(id, user);
  }

  async signSupervisor(id: string, dto: SignIvcDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status === IvcStatus.DRAFT) {
      throw new BadRequestException('Submit IVC before supervisor sign-off');
    }
    await this.prisma.interimValuationCertificate.update({
      where: { id },
      data: {
        supervisorSignedAt: new Date(),
        supervisorSignedBy: dto.signedBy ?? `${user.firstName} ${user.lastName}`.trim(),
      },
    });
    return this.finalizeIfSigned(id, user);
  }

  async signSubcontractor(id: string, dto: SignIvcDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status === IvcStatus.DRAFT) {
      throw new BadRequestException('Submit IVC before subcontractor sign-off');
    }
    await this.prisma.interimValuationCertificate.update({
      where: { id },
      data: {
        subcontractorSignedAt: new Date(),
        subcontractorSignedBy: dto.signedBy ?? existing.subcontractorName,
      },
    });
    return this.finalizeIfSigned(id, user);
  }

  private async finalizeIfSigned(id: string, user: AuthUser) {
    const row = await this.findOne(id, user);
    if (
      row.pmSignedAt &&
      row.supervisorSignedAt &&
      row.status === IvcStatus.SUBMITTED
    ) {
      return this.prisma.interimValuationCertificate.update({
        where: { id },
        data: { status: IvcStatus.APPROVED, approvedAt: new Date() },
        include,
      });
    }
    return row;
  }

  async buildPdf(id: string, user: AuthUser) {
    const row = await this.findOne(id, user);
    const { buildIvcPdf } = await import('./ivc.pdf');
    return buildIvcPdf({
      number: row.number,
      projectName: row.project.name,
      workDescription: row.workDescription,
      subcontractorName: row.subcontractorName,
      accountDetails: row.accountDetails,
      scopeOfWork: row.scopeOfWork,
      contractReference: row.contractReference,
      contractAmount: Number(row.contractAmount),
      deliveryPeriod: row.deliveryPeriod,
      startDate: row.startDate,
      endDate: row.endDate,
      stages: (row.stagesJson as Parameters<typeof buildIvcPdf>[0]['stages']) ?? [],
      recommendation: row.recommendation,
      status: row.status,
      preparedBy: row.preparedBy,
      pmSignedBy: row.pmSignedBy,
      supervisorSignedBy: row.supervisorSignedBy,
      subcontractorSignedBy: row.subcontractorSignedBy,
      createdAt: row.createdAt,
    });
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
