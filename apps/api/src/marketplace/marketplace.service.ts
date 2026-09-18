import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ArtisanApprovalStatus,
  MarketplaceJobStatus,
  MarketplacePaymentMethod,
  MarketplacePaymentStatus,
  MarketplaceQuoteStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CompanySettingsService } from '../company-settings/company-settings.service';
import { MoneyInflowsService } from '../money-inflows/money-inflows.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { filterMarketplaceChat } from './chat-filter';
import {
  AssignArtisansDto,
  CreateMarketplaceJobDto,
  InitiateEscrowDto,
  PostChatMessageDto,
  PublicSeekerRegisterDto,
  SelectQuoteDto,
  SubmitQuoteDto,
} from './dto/marketplace.dto';
import { MARKETPLACE_CATALOG } from './catalog-data';
import { MoneyChannel } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  private readonly uploadsDir = path.join(process.cwd(), '..', '..', 'uploads', 'marketplace');

  constructor(
    private readonly prisma: PrismaService,
    private readonly companySettings: CompanySettingsService,
    private readonly config: ConfigService,
    private readonly moneyInflows: MoneyInflowsService,
  ) {
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  async ensureCatalogSeeded() {
    const count = await this.prisma.marketplaceCatalogItem.count();
    if (count > 0) return { seeded: false, count };
    await this.prisma.marketplaceCatalogItem.createMany({
      data: MARKETPLACE_CATALOG.map((c) => ({
        code: c.code,
        category: c.category,
        label: c.label,
        description: c.description,
        sortOrder: c.sortOrder,
        isActive: true,
      })),
    });
    return { seeded: true, count: MARKETPLACE_CATALOG.length };
  }

  async listCatalog(q?: string) {
    await this.ensureCatalogSeeded();
    const items = await this.prisma.marketplaceCatalogItem.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { label: { contains: q } },
                { category: { contains: q } },
                { description: { contains: q } },
                { code: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    return items;
  }

  paystackAvailable() {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    const pub = this.config.get<string>('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY') ||
      this.config.get<string>('PAYSTACK_PUBLIC_KEY');
    return Boolean(secret && pub && !secret.includes('CHANGE') && secret.length > 10);
  }

  paymentMethods() {
    return {
      bankTransferProof: { available: true, label: 'Bank transfer + proof upload' },
      paystack: {
        available: this.paystackAvailable(),
        label: this.paystackAvailable()
          ? 'Pay with Paystack'
          : 'Paystack (unavailable — keys not configured)',
      },
    };
  }

  async registerSeeker(dto: PublicSeekerRegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.MARKETPLACE_SEEKER,
        isActive: true,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    return {
      user,
      message: 'Account created. Log in, then select a job type and submit your request.',
    };
  }

  async createJob(dto: CreateMarketplaceJobDto, user: AuthUser) {
    this.assertSeeker(user);
    const catalog = await this.prisma.marketplaceCatalogItem.findUnique({
      where: { id: dto.catalogItemId },
    });
    if (!catalog || !catalog.isActive) throw new BadRequestException('Invalid job type');

    const publicId = this.makePublicId();
    return this.prisma.marketplaceJob.create({
      data: {
        publicId,
        catalogItemId: catalog.id,
        seekerUserId: user.id,
        title: dto.title || catalog.label,
        description: dto.description,
        locationText: dto.locationText,
        addressText: dto.addressText,
        formPayload: (dto.formPayload as object | undefined) ?? undefined,
        photoUrls: dto.photoUrls ?? [],
        status: MarketplaceJobStatus.SUBMITTED,
      },
      include: { catalogItem: true },
    });
  }

  async myJobs(user: AuthUser) {
    if (user.role === UserRole.MARKETPLACE_SEEKER || user.role === UserRole.CLIENT) {
      return this.prisma.marketplaceJob.findMany({
        where: { seekerUserId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          catalogItem: true,
          quotes: {
            include: {
              artisan: { select: { id: true, fullName: true, businessName: true, source: true, avgRating: true } },
            },
          },
          assignments: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });
    }
    if (user.role === UserRole.ARTISAN) {
      const profile = await this.prisma.artisanProfile.findUnique({ where: { userId: user.id } });
      if (!profile) return [];
      return this.prisma.marketplaceJob.findMany({
        where: { assignments: { some: { artisanId: profile.id } } },
        orderBy: { createdAt: 'desc' },
        include: {
          catalogItem: true,
          quotes: { where: { artisanId: profile.id } },
          assignments: { where: { artisanId: profile.id } },
        },
      });
    }
    this.assertStaff(user);
    return this.prisma.marketplaceJob.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        catalogItem: true,
        seeker: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignments: {
          include: { artisan: { select: { id: true, fullName: true, source: true, status: true } } },
        },
        quotes: true,
      },
      take: 200,
    });
  }

  async getJob(idOrPublic: string, user: AuthUser) {
    const job = await this.prisma.marketplaceJob.findFirst({
      where: {
        OR: [{ id: idOrPublic }, { publicId: idOrPublic }],
      },
      include: {
        catalogItem: true,
        seeker: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignments: {
          include: { artisan: { select: { id: true, fullName: true, businessName: true, source: true, status: true } } },
        },
        quotes: {
          include: {
            artisan: { select: { id: true, fullName: true, businessName: true, source: true, avgRating: true } },
          },
        },
        chatThread: true,
        payments: { orderBy: { createdAt: 'desc' } },
        selectedQuote: true,
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    await this.assertCanViewJob(job, user);
    return this.sanitizeJobForViewer(job, user);
  }

  async assignArtisans(jobId: string, dto: AssignArtisansDto, user: AuthUser) {
    this.assertStaff(user);
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (
      job.status !== MarketplaceJobStatus.SUBMITTED &&
      job.status !== MarketplaceJobStatus.ASSIGNED &&
      job.status !== MarketplaceJobStatus.QUOTED
    ) {
      throw new BadRequestException('Job cannot accept new assignments in current status');
    }
    if (!dto.artisanIds?.length) throw new BadRequestException('Select at least one artisan');

    const artisans = await this.prisma.artisanProfile.findMany({
      where: { id: { in: dto.artisanIds }, status: ArtisanApprovalStatus.APPROVED },
    });
    if (artisans.length !== dto.artisanIds.length) {
      throw new BadRequestException('All artisans must exist and be APPROVED');
    }

    await this.prisma.$transaction(
      dto.artisanIds.map((artisanId) =>
        this.prisma.marketplaceJobAssignment.upsert({
          where: { jobId_artisanId: { jobId, artisanId } },
          create: { jobId, artisanId, assignedById: user.id, note: dto.note },
          update: { note: dto.note },
        }),
      ),
    );

    return this.prisma.marketplaceJob.update({
      where: { id: jobId },
      data: { status: MarketplaceJobStatus.ASSIGNED },
      include: {
        assignments: { include: { artisan: true } },
        catalogItem: true,
      },
    });
  }

  async submitQuote(jobId: string, dto: SubmitQuoteDto, user: AuthUser) {
    if (user.role !== UserRole.ARTISAN) throw new ForbiddenException('Artisans only');
    const profile = await this.prisma.artisanProfile.findUnique({ where: { userId: user.id } });
    if (!profile || profile.status !== ArtisanApprovalStatus.APPROVED) {
      throw new ForbiddenException('Artisan profile not approved');
    }

    const assignment = await this.prisma.marketplaceJobAssignment.findUnique({
      where: { jobId_artisanId: { jobId, artisanId: profile.id } },
    });
    if (!assignment) throw new ForbiddenException('You were not assigned to this job');

    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (
      job.status !== MarketplaceJobStatus.ASSIGNED &&
      job.status !== MarketplaceJobStatus.QUOTED
    ) {
      throw new BadRequestException('Quotes are closed for this job');
    }

    if (dto.message) {
      const check = filterMarketplaceChat(dto.message, { addressUnlocked: false });
      if (!check.ok) throw new BadRequestException(check.message);
    }

    const quote = await this.prisma.marketplaceQuote.upsert({
      where: { jobId_artisanId: { jobId, artisanId: profile.id } },
      create: {
        jobId,
        artisanId: profile.id,
        artisanUserId: user.id,
        workmanshipAmount: dto.workmanshipAmount,
        materialsEstimate: dto.materialsEstimate,
        materialsNote:
          dto.materialsNote ??
          'Materials are paid directly to the artisan — not through Propa3 escrow.',
        depositAmount: dto.depositAmount,
        message: dto.message,
        status: MarketplaceQuoteStatus.SUBMITTED,
      },
      update: {
        workmanshipAmount: dto.workmanshipAmount,
        materialsEstimate: dto.materialsEstimate,
        materialsNote: dto.materialsNote,
        depositAmount: dto.depositAmount,
        message: dto.message,
        status: MarketplaceQuoteStatus.SUBMITTED,
      },
    });

    await this.prisma.marketplaceJob.update({
      where: { id: jobId },
      data: { status: MarketplaceJobStatus.QUOTED },
    });

    return quote;
  }

  async selectQuote(jobId: string, dto: SelectQuoteDto, user: AuthUser) {
    this.assertSeeker(user);
    const job = await this.prisma.marketplaceJob.findUnique({
      where: { id: jobId },
      include: { quotes: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.seekerUserId !== user.id) throw new ForbiddenException();
    if (job.status !== MarketplaceJobStatus.QUOTED && job.status !== MarketplaceJobStatus.ASSIGNED) {
      throw new BadRequestException('Cannot select a quote in current status');
    }

    const quote = job.quotes.find((q) => q.id === dto.quoteId);
    if (!quote || quote.status !== MarketplaceQuoteStatus.SUBMITTED) {
      throw new BadRequestException('Invalid quote');
    }

    const fees = await this.companySettings.get();
    const feePct = Number(fees.marketplacePlatformFeePct ?? fees.servicesPlatformFeePct ?? 2.5);
    const workmanship = Number(quote.workmanshipAmount);
    const platformFeeAmount = Math.round(workmanship * (feePct / 100) * 100) / 100;

    await this.prisma.$transaction([
      this.prisma.marketplaceQuote.updateMany({
        where: { jobId, id: { not: quote.id } },
        data: { status: MarketplaceQuoteStatus.REJECTED },
      }),
      this.prisma.marketplaceQuote.update({
        where: { id: quote.id },
        data: { status: MarketplaceQuoteStatus.ACCEPTED },
      }),
      this.prisma.marketplaceJob.update({
        where: { id: jobId },
        data: {
          selectedQuoteId: quote.id,
          workmanshipAmount: quote.workmanshipAmount,
          materialsNote: quote.materialsNote,
          platformFeePctSnapshot: feePct,
          platformFeeAmount,
          status: MarketplaceJobStatus.AWAITING_PAYMENT,
        },
      }),
      this.prisma.chatThread.upsert({
        where: { jobId },
        create: { jobId, addressUnlocked: false },
        update: {},
      }),
    ]);

    return this.getJob(jobId, user);
  }

  async listMessages(jobId: string, user: AuthUser) {
    const job = await this.getJobRaw(jobId);
    await this.assertCanChat(job, user);
    const thread = await this.prisma.chatThread.findUnique({ where: { jobId: job.id } });
    if (!thread) return { addressUnlocked: false, messages: [] };
    const messages = await this.prisma.chatMessage.findMany({
      where: { threadId: thread.id, moderation: { not: 'BLOCKED' } },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    return { addressUnlocked: thread.addressUnlocked, messages };
  }

  async postMessage(jobId: string, dto: PostChatMessageDto, user: AuthUser) {
    const job = await this.getJobRaw(jobId);
    await this.assertCanChat(job, user);
    let thread = await this.prisma.chatThread.findUnique({ where: { jobId: job.id } });
    if (!thread) {
      if (
        job.status === MarketplaceJobStatus.AWAITING_PAYMENT ||
        job.status === MarketplaceJobStatus.IN_PROGRESS ||
        job.status === MarketplaceJobStatus.AWAITING_CONFIRM ||
        job.status === MarketplaceJobStatus.SELECTED
      ) {
        thread = await this.prisma.chatThread.create({
          data: { jobId: job.id, addressUnlocked: Boolean(job.escrowPaidAt) },
        });
      } else {
        throw new BadRequestException('Chat opens after you select an artisan quote');
      }
    }

    const check = filterMarketplaceChat(dto.body, {
      addressUnlocked: thread.addressUnlocked,
    });
    if (!check.ok) {
      await this.prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          senderId: user.id,
          body: dto.body,
          moderation: 'BLOCKED',
          blockedReason: check.reason,
        },
      });
      throw new BadRequestException(check.message);
    }

    return this.prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        senderId: user.id,
        body: dto.body,
        moderation: 'OK',
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  async initiateEscrow(jobId: string, dto: InitiateEscrowDto, user: AuthUser) {
    this.assertSeeker(user);
    const job = await this.prisma.marketplaceJob.findUnique({
      where: { id: jobId },
      include: { selectedQuote: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.seekerUserId !== user.id) throw new ForbiddenException();
    if (!job.selectedQuote) throw new BadRequestException('Select a quote first');
    if (
      job.status !== MarketplaceJobStatus.AWAITING_PAYMENT &&
      job.status !== MarketplaceJobStatus.SELECTED
    ) {
      throw new BadRequestException('Job is not awaiting payment');
    }

    if (dto.method === 'PAYSTACK' && !this.paystackAvailable()) {
      throw new ServiceUnavailableException(
        'Paystack is unavailable until PAYSTACK keys are configured in the server environment.',
      );
    }

    const full = Number(job.workmanshipAmount ?? job.selectedQuote.workmanshipAmount);
    const depositDefault = job.selectedQuote.depositAmount
      ? Number(job.selectedQuote.depositAmount)
      : full;
    const amount = dto.amount ?? (dto.isDeposit ? depositDefault : full);
    if (amount <= 0 || amount > full) throw new BadRequestException('Invalid payment amount');

    const feePct = Number(job.platformFeePctSnapshot ?? 2.5);
    const platformFeeAmount = Math.round(amount * (feePct / 100) * 100) / 100;

    if (dto.method === 'BANK_TRANSFER_PROOF' && !dto.proofUrl) {
      // Allow creating pending payment; proof can be attached same call or later
    }

    const payment = await this.prisma.marketplaceEscrowPayment.create({
      data: {
        jobId: job.id,
        payerUserId: user.id,
        method:
          dto.method === 'PAYSTACK'
            ? MarketplacePaymentMethod.PAYSTACK
            : MarketplacePaymentMethod.BANK_TRANSFER_PROOF,
        status:
          dto.method === 'BANK_TRANSFER_PROOF'
            ? dto.proofUrl
              ? MarketplacePaymentStatus.PENDING_VERIFICATION
              : MarketplacePaymentStatus.PENDING_PROOF
            : MarketplacePaymentStatus.PENDING_VERIFICATION,
        amount,
        isDeposit: Boolean(dto.isDeposit) || amount < full,
        platformFeePct: feePct,
        platformFeeAmount,
        proofUrl: dto.proofUrl,
      },
    });

    return {
      payment,
      methods: this.paymentMethods(),
      bank: await this.companySettings.get().then((s) => ({
        companyLegalName: s.companyLegalName,
        bankName: s.bankName,
        bankAccountName: s.bankAccountName,
        bankAccountNumber: s.bankAccountNumber,
        note: 'Pay workmanship / job fee only. Materials are paid directly to the artisan.',
      })),
    };
  }

  /** Seeker uploads bank-transfer proof file for an escrow payment (or creates one). */
  async uploadEscrowProof(
    jobId: string,
    file: Express.Multer.File | undefined,
    user: AuthUser,
    opts?: { amount?: number; isDeposit?: boolean; paymentId?: string },
  ) {
    this.assertSeeker(user);
    if (!file?.buffer?.length) throw new BadRequestException('Proof file is required');

    const job = await this.prisma.marketplaceJob.findUnique({
      where: { id: jobId },
      include: { selectedQuote: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.seekerUserId !== user.id && user.role !== UserRole.CEO && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }
    if (!job.selectedQuote) throw new BadRequestException('Select a quote first');

    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    fs.writeFileSync(path.join(this.uploadsDir, safeName), file.buffer);
    const proofUrl = `/uploads/marketplace/${safeName}`;

    if (opts?.paymentId) {
      const existing = await this.prisma.marketplaceEscrowPayment.findUnique({
        where: { id: opts.paymentId },
      });
      if (!existing || existing.jobId !== job.id) throw new NotFoundException('Payment not found');
      return this.prisma.marketplaceEscrowPayment.update({
        where: { id: opts.paymentId },
        data: {
          proofUrl,
          status: MarketplacePaymentStatus.PENDING_VERIFICATION,
        },
      });
    }

    const full = Number(job.workmanshipAmount ?? job.selectedQuote.workmanshipAmount);
    const amount = opts?.amount && opts.amount > 0 ? opts.amount : full;
    const feePct = Number(job.platformFeePctSnapshot ?? 2.5);
    const platformFeeAmount = Math.round(amount * (feePct / 100) * 100) / 100;

    return this.prisma.marketplaceEscrowPayment.create({
      data: {
        jobId: job.id,
        payerUserId: user.id,
        method: MarketplacePaymentMethod.BANK_TRANSFER_PROOF,
        status: MarketplacePaymentStatus.PENDING_VERIFICATION,
        amount,
        isDeposit: Boolean(opts?.isDeposit) || amount < full,
        platformFeePct: feePct,
        platformFeeAmount,
        proofUrl,
      },
    });
  }

  /** Finance / Admin — verify bank proof and hold escrow. */
  async verifyEscrowPayment(paymentId: string, user: AuthUser) {
    this.assertFinanceOrAdmin(user);
    const payment = await this.prisma.marketplaceEscrowPayment.findUnique({
      where: { id: paymentId },
      include: {
        job: {
          include: {
            seeker: { select: { firstName: true, lastName: true, email: true } },
            selectedQuote: {
              include: {
                artisan: { select: { fullName: true, userId: true } },
              },
            },
          },
        },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (
      payment.status !== MarketplacePaymentStatus.PENDING_VERIFICATION &&
      payment.status !== MarketplacePaymentStatus.PENDING_PROOF
    ) {
      throw new BadRequestException('Payment not awaiting verification');
    }

    const inflow = await this.moneyInflows.createFromMarketplaceEscrow({
      escrowPaymentId: payment.id,
      amount: Number(payment.amount),
      platformFeeAmount: Number(payment.platformFeeAmount),
      platformFeePct: Number(payment.platformFeePct),
      payerName:
        [payment.job.seeker.firstName, payment.job.seeker.lastName].filter(Boolean).join(' ') ||
        payment.job.seeker.email,
      jobPublicId: payment.job.publicId,
      artisanName: payment.job.selectedQuote?.artisan.fullName ?? 'Artisan',
      artisanUserId: payment.job.selectedQuote?.artisan.userId,
      channel:
        payment.method === MarketplacePaymentMethod.PAYSTACK
          ? MoneyChannel.PAYSTACK
          : MoneyChannel.BANK_TRANSFER,
    });

    await this.prisma.$transaction([
      this.prisma.marketplaceEscrowPayment.update({
        where: { id: paymentId },
        data: {
          status: MarketplacePaymentStatus.HELD,
          verifiedAt: new Date(),
          verifiedById: user.id,
          moneyInflowId: inflow.id,
        },
      }),
      this.prisma.marketplaceJob.update({
        where: { id: payment.jobId },
        data: {
          escrowPaidAt: new Date(),
          status: MarketplaceJobStatus.IN_PROGRESS,
        },
      }),
      this.prisma.chatThread.updateMany({
        where: { jobId: payment.jobId },
        data: { addressUnlocked: true },
      }),
    ]);

    return this.prisma.marketplaceEscrowPayment.findUnique({
      where: { id: paymentId },
    });
  }

  async confirmComplete(jobId: string, user: AuthUser) {
    this.assertSeeker(user);
    const job = await this.prisma.marketplaceJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.seekerUserId !== user.id) throw new ForbiddenException();
    if (job.status !== MarketplaceJobStatus.IN_PROGRESS && job.status !== MarketplaceJobStatus.AWAITING_CONFIRM) {
      throw new BadRequestException('Job is not ready to complete');
    }

    const payment = await this.prisma.marketplaceEscrowPayment.findFirst({
      where: { jobId, status: MarketplacePaymentStatus.HELD },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.$transaction(async (tx) => {
      if (payment) {
        await tx.marketplaceEscrowPayment.update({
          where: { id: payment.id },
          data: { status: MarketplacePaymentStatus.RELEASED, releasedAt: new Date() },
        });
      }
      await tx.marketplaceJob.update({
        where: { id: jobId },
        data: { status: MarketplaceJobStatus.COMPLETED, completedAt: new Date() },
      });
      if (job.selectedQuoteId) {
        const q = await tx.marketplaceQuote.findUnique({ where: { id: job.selectedQuoteId } });
        if (q) {
          await tx.artisanProfile.update({
            where: { id: q.artisanId },
            data: { jobsCompleted: { increment: 1 } },
          });
        }
      }
    });

    return this.getJob(jobId, user);
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private makePublicId() {
    return `MJ-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private assertSeeker(user: AuthUser) {
    if (
      user.role !== UserRole.MARKETPLACE_SEEKER &&
      user.role !== UserRole.CLIENT &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Seeker account required');
    }
  }

  private assertStaff(user: AuthUser) {
    const ok: UserRole[] = [
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
    ];
    if (!ok.includes(user.role)) throw new ForbiddenException();
  }

  private assertFinanceOrAdmin(user: AuthUser) {
    const ok: UserRole[] = [UserRole.FINANCE, UserRole.CEO, UserRole.ADMIN];
    if (!ok.includes(user.role)) throw new ForbiddenException();
  }

  private async getJobRaw(idOrPublic: string) {
    const job = await this.prisma.marketplaceJob.findFirst({
      where: { OR: [{ id: idOrPublic }, { publicId: idOrPublic }] },
      include: {
        selectedQuote: true,
        assignments: true,
        chatThread: true,
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private async assertCanViewJob(
    job: { seekerUserId: string; assignments: { artisanId: string }[] },
    user: AuthUser,
  ) {
    if (
      user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.PROJECT_MANAGER ||
      user.role === UserRole.FINANCE
    ) {
      return;
    }
    if (job.seekerUserId === user.id) return;
    if (user.role === UserRole.ARTISAN) {
      const profile = await this.prisma.artisanProfile.findUnique({ where: { userId: user.id } });
      if (profile && job.assignments.some((a) => a.artisanId === profile.id)) return;
    }
    throw new ForbiddenException();
  }

  private async assertCanChat(
    job: {
      id: string;
      seekerUserId: string;
      status: MarketplaceJobStatus;
      selectedQuoteId: string | null;
      assignments: { artisanId: string }[];
      selectedQuote?: { artisanId: string } | null;
    },
    user: AuthUser,
  ) {
    const chatOkStatuses: MarketplaceJobStatus[] = [
      MarketplaceJobStatus.SELECTED,
      MarketplaceJobStatus.AWAITING_PAYMENT,
      MarketplaceJobStatus.IN_PROGRESS,
      MarketplaceJobStatus.AWAITING_CONFIRM,
      MarketplaceJobStatus.COMPLETED,
      MarketplaceJobStatus.DISPUTED,
    ];
    if (!chatOkStatuses.includes(job.status) || !job.selectedQuoteId) {
      throw new BadRequestException('Chat opens after an artisan quote is selected');
    }
    if (user.role === UserRole.CEO || user.role === UserRole.ADMIN) return;
    if (job.seekerUserId === user.id) return;
    if (user.role === UserRole.ARTISAN) {
      const profile = await this.prisma.artisanProfile.findUnique({ where: { userId: user.id } });
      const selectedArtisanId = job.selectedQuote?.artisanId;
      if (profile && selectedArtisanId === profile.id) return;
    }
    throw new ForbiddenException();
  }

  private sanitizeJobForViewer<
    T extends {
      seekerUserId: string;
      addressText: string | null;
      escrowPaidAt: Date | null;
    },
  >(job: T, user: AuthUser) {
    const staff =
      user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      user.role === UserRole.PROJECT_MANAGER ||
      user.role === UserRole.FINANCE;
    if (staff || job.escrowPaidAt || job.seekerUserId === user.id) {
      return job;
    }
    return { ...job, addressText: null };
  }
}
