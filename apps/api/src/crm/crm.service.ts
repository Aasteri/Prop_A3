import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadSource, LeadStage, ListingStatus, NotificationType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateLeadDto,
  PublicInquiryDto,
  UpdateLeadDto,
  UpdateLeadStageDto,
} from './dto/lead.dto';
import { CreateClientDto, LinkPortalUserDto } from './dto/client.dto';
import {
  generateClientRef,
  generateLeadRef,
  nextStages,
  PIPELINE_STAGES,
  stageLabel,
} from './crm.utils';
import { SalesInspectionsService } from '../sales-inspections/sales-inspections.service';
import { SalesOffersService } from '../sales-offers/sales-offers.service';

const portalUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
} as const;

const clientInclude = {
  lead: {
    select: {
      id: true,
      leadRef: true,
      listing: { select: { listingRef: true, location: true } },
    },
  },
  portalUser: { select: portalUserSelect },
} as const;

const leadInclude = {
  listing: {
    select: {
      id: true,
      listingRef: true,
      location: true,
      propertyType: true,
      status: true,
    },
  },
  assignedTo: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  client: {
    select: { id: true, clientRef: true, firstName: true, lastName: true },
  },
};

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly inspections: SalesInspectionsService,
    private readonly salesOffers: SalesOffersService,
  ) {}

  pipelineMeta(user: AuthUser) {
    this.assertCanView(user);
    return {
      stages: PIPELINE_STAGES.map((s) => ({ value: s, label: stageLabel(s) })),
    };
  }

  async pipeline(user: AuthUser) {
    this.assertCanView(user);
    const leads = await this.prisma.lead.findMany({
      include: leadInclude,
      orderBy: [{ stageUpdatedAt: 'desc' }],
    });

    const grouped: Record<string, typeof leads> = {};
    for (const stage of PIPELINE_STAGES) {
      grouped[stage] = leads.filter((l) => l.stage === stage);
    }

    return {
      stages: PIPELINE_STAGES.map((stage) => ({
        stage,
        label: stageLabel(stage),
        count: grouped[stage].length,
        leads: grouped[stage],
      })),
      totals: {
        active: leads.filter((l) => l.stage !== LeadStage.WON && l.stage !== LeadStage.LOST).length,
        won: grouped[LeadStage.WON].length,
        lost: grouped[LeadStage.LOST].length,
      },
    };
  }

  findAll(user: AuthUser, stage?: LeadStage) {
    this.assertCanView(user);
    return this.prisma.lead.findMany({
      where: stage ? { stage } : {},
      include: leadInclude,
      orderBy: [{ stageUpdatedAt: 'desc' }],
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });
    if (!lead) throw new NotFoundException('Lead not found');
    const inspectionCompleted = await this.inspections.hasCompletedResponse(id);
    const hasAcceptedSalesOffer = await this.salesOffers.hasAcceptedOffer(id);
    return {
      ...lead,
      nextStages: nextStages(lead.stage),
      inspectionCompleted,
      hasAcceptedSalesOffer,
    };
  }

  listClients(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.client.findMany({
      include: clientInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Users that can be linked/upgraded to a property CLIENT (seekers, or CLIENT with no portal row). */
  async searchLinkableUsers(user: AuthUser, q?: string) {
    this.assertCanCreate(user);
    const query = (q ?? '').trim();
    const linkedIds = (
      await this.prisma.client.findMany({
        where: { portalUserId: { not: null } },
        select: { portalUserId: true },
      })
    )
      .map((c) => c.portalUserId!)
      .filter(Boolean);

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: linkedIds.length ? { notIn: linkedIds } : undefined,
        role: { in: [UserRole.MARKETPLACE_SEEKER, UserRole.CLIENT] },
        ...(query
          ? {
              OR: [
                { email: { contains: query } },
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                { phone: { contains: query } },
              ],
            }
          : {}),
      },
      select: portalUserSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 40,
    });
    return users;
  }

  async createClient(dto: CreateClientDto, user: AuthUser) {
    this.assertCanCreate(user);

    return this.prisma.$transaction(async (tx) => {
      const clientRef = await generateClientRef(tx);
      let portalUserId: string | undefined;
      let temporaryPassword: string | undefined;
      let firstName = dto.firstName?.trim() ?? '';
      let lastName = dto.lastName?.trim() ?? '';
      let phone = dto.phone?.trim() ?? '';
      let email = dto.email?.toLowerCase().trim() || null;

      if (dto.existingUserId) {
        const existing = await tx.user.findUnique({ where: { id: dto.existingUserId } });
        if (!existing || !existing.isActive) throw new NotFoundException('User not found');
        await this.assertUserLinkable(tx, existing);
        firstName = existing.firstName;
        lastName = existing.lastName;
        phone = existing.phone?.trim() || phone || 'N/A';
        email = existing.email;
        await tx.user.update({
          where: { id: existing.id },
          data: { role: UserRole.CLIENT },
        });
        portalUserId = existing.id;
      } else {
        if (!firstName || !lastName || !phone) {
          throw new BadRequestException('firstName, lastName, and phone are required');
        }
        if (dto.createLogin) {
          if (!email) throw new BadRequestException('Email is required to create a login');
          if (!dto.password || dto.password.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
          }
          const clash = await tx.user.findUnique({ where: { email } });
          if (clash) {
            throw new ConflictException(
              'That email already has a Propa3 login. Select them under “Existing user” instead.',
            );
          }
          const passwordHash = await bcrypt.hash(dto.password, 10);
          const created = await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName,
              lastName,
              phone,
              role: UserRole.CLIENT,
              isActive: true,
            },
          });
          portalUserId = created.id;
          temporaryPassword = dto.password;
        } else if (email) {
          const match = await tx.user.findUnique({ where: { email } });
          if (match) {
            await this.assertUserLinkable(tx, match);
            await tx.user.update({
              where: { id: match.id },
              data: { role: UserRole.CLIENT },
            });
            portalUserId = match.id;
            firstName = match.firstName;
            lastName = match.lastName;
            phone = match.phone?.trim() || phone;
          }
        }
      }

      const client = await tx.client.create({
        data: {
          clientRef,
          firstName,
          lastName,
          phone,
          email,
          address: dto.address?.trim() || null,
          preferences: dto.preferences?.trim() || null,
          portalUserId: portalUserId ?? null,
        },
        include: clientInclude,
      });

      return {
        client,
        portalLinked: Boolean(portalUserId),
        upgradedFromSeeker: Boolean(dto.existingUserId || portalUserId),
        temporaryPassword,
      };
    });
  }

  async linkPortalUser(clientId: string, dto: LinkPortalUserDto, user: AuthUser) {
    this.assertCanCreate(user);
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.portalUserId) {
      throw new BadRequestException('Client already has a portal login linked');
    }

    let target =
      dto.userId
        ? await this.prisma.user.findUnique({ where: { id: dto.userId } })
        : dto.email
          ? await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } })
          : null;

    if (!target && client.email) {
      target = await this.prisma.user.findUnique({
        where: { email: client.email.toLowerCase().trim() },
      });
    }
    if (!target) throw new NotFoundException('No matching user to link');

    await this.assertUserLinkable(this.prisma, target);

    await this.prisma.user.update({
      where: { id: target.id },
      data: { role: UserRole.CLIENT },
    });

    return this.prisma.client.update({
      where: { id: clientId },
      data: { portalUserId: target.id },
      include: clientInclude,
    });
  }

  private async assertUserLinkable(
    db: {
      client: { findUnique: PrismaService['client']['findUnique'] };
    },
    existing: { id: string; role: UserRole; email: string },
  ) {
    const already = await db.client.findUnique({ where: { portalUserId: existing.id } });
    if (already) {
      throw new ConflictException(`User ${existing.email} is already linked to ${already.clientRef}`);
    }
    const linkable: UserRole[] = [UserRole.MARKETPLACE_SEEKER, UserRole.CLIENT];
    if (!linkable.includes(existing.role)) {
      throw new BadRequestException(
        `Cannot promote ${existing.role} to CLIENT. Link marketplace seekers (or unlinked CLIENT accounts) only.`,
      );
    }
  }

  async createLead(dto: CreateLeadDto, user: AuthUser | null, source: LeadSource = LeadSource.MANUAL) {
    if (user) this.assertCanCreate(user);
    if (dto.listingId) {
      const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
      if (!listing) throw new NotFoundException('Listing not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const leadRef = await generateLeadRef(tx);
      return tx.lead.create({
        data: {
          leadRef,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          source: dto.source ?? source,
          listingId: dto.listingId,
          assignedToId: dto.assignedToId ?? user?.id,
          budgetNgn: dto.budgetNgn,
          preferences: dto.preferences,
          dealValueNgn: dto.dealValueNgn,
          notes: dto.notes,
          createdById: user?.id,
        },
        include: leadInclude,
      });
    });
  }

  async createPublicInquiry(dto: PublicInquiryDto) {
    const lead = await this.createLead(
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        listingId: dto.listingId,
        preferences: dto.message,
        notes: dto.message,
      },
      null,
      LeadSource.WEB,
    );

    let result = lead;
    if (dto.utmSource || dto.utmCampaign) {
      result = await this.prisma.lead.update({
        where: { id: lead.id },
        data: { utmSource: dto.utmSource, utmCampaign: dto.utmCampaign },
        include: leadInclude,
      });
    }

    const salesIds = await this.notifications.salesUserIds();
    if (salesIds.length) {
      await this.notifications.notifyUsers(salesIds, {
        type: NotificationType.LEAD_INQUIRY,
        title: `New web inquiry — ${dto.firstName} ${dto.lastName}`,
        body: `Phone: ${dto.phone}${dto.email ? ` · Email: ${dto.email}` : ''}${dto.message ? `\n${dto.message}` : ''}`,
        linkUrl: `/crm/leads/${result.id}`,
      });
    }

    return result;
  }

  async updateLead(id: string, dto: UpdateLeadDto, user: AuthUser) {
    this.assertCanCreate(user);
    const lead = await this.findOne(id, user);
    if (lead.stage === LeadStage.WON || lead.stage === LeadStage.LOST) {
      throw new BadRequestException('Closed leads cannot be edited');
    }

    return this.prisma.lead.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        listingId: dto.listingId,
        assignedToId: dto.assignedToId,
        budgetNgn: dto.budgetNgn,
        preferences: dto.preferences,
        dealValueNgn: dto.dealValueNgn,
        notes: dto.notes,
      },
      include: leadInclude,
    });
  }

  async updateStage(id: string, dto: UpdateLeadStageDto, user: AuthUser) {
    this.assertCanCreate(user);
    const lead = await this.findOne(id, user);

    if (lead.stage === LeadStage.WON || lead.stage === LeadStage.LOST) {
      throw new BadRequestException('Lead is already closed');
    }

    if (dto.stage === LeadStage.WON) {
      throw new BadRequestException('Use convert to client to mark lead as won');
    }

    const allowed = nextStages(lead.stage);
    if (!allowed.includes(dto.stage) && dto.stage !== lead.stage) {
      throw new BadRequestException(`Cannot move from ${lead.stage} to ${dto.stage}`);
    }

    if (dto.stage === LeadStage.LOST && !dto.lostReason?.trim()) {
      throw new BadRequestException('Lost reason is required');
    }

    // BRD: physical inspection + platform response required before negotiation/reservation
    if (
      (dto.stage === LeadStage.NEGOTIATION || dto.stage === LeadStage.RESERVED) &&
      !(await this.inspections.hasCompletedResponse(id))
    ) {
      throw new BadRequestException(
        'Log a completed viewing/inspection response before advancing past Viewing',
      );
    }

    // FORM_SALES_OFFER: reservation requires an accepted sales offer
    if (dto.stage === LeadStage.RESERVED && !(await this.salesOffers.hasAcceptedOffer(id))) {
      throw new BadRequestException(
        'Issue and accept a sales offer (SOF) before moving to Reserved',
      );
    }

    if (dto.stage === LeadStage.RESERVED && lead.listingId) {
      await this.prisma.listing.update({
        where: { id: lead.listingId },
        data: { status: ListingStatus.RESERVED },
      });
    }

    return this.prisma.lead.update({
      where: { id },
      data: {
        stage: dto.stage,
        lostReason: dto.stage === LeadStage.LOST ? dto.lostReason : null,
        stageUpdatedAt: new Date(),
      },
      include: leadInclude,
    });
  }

  async convertToClient(id: string, user: AuthUser) {
    this.assertCanCreate(user);
    const lead = await this.findOne(id, user);

    if (lead.client) {
      throw new BadRequestException('Lead already converted');
    }

    if (
      lead.stage !== LeadStage.NEGOTIATION &&
      lead.stage !== LeadStage.RESERVED &&
      lead.stage !== LeadStage.VIEWING
    ) {
      throw new BadRequestException(
        'Convert only from Viewing (after inspection), Negotiation, or Reserved',
      );
    }

    if (!(await this.inspections.hasCompletedResponse(id))) {
      throw new BadRequestException(
        'Mandatory physical inspection response must be logged before convert',
      );
    }

    if (
      (lead.stage === LeadStage.NEGOTIATION || lead.stage === LeadStage.RESERVED) &&
      !(await this.salesOffers.hasAcceptedOffer(id))
    ) {
      throw new BadRequestException(
        'Accept a sales offer (SOF) before converting Negotiation/Reserved leads',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const clientRef = await generateClientRef(tx);

      let portalUserId: string | null = null;
      if (lead.email) {
        const match = await tx.user.findUnique({
          where: { email: lead.email.toLowerCase().trim() },
        });
        if (match?.isActive) {
          const already = await tx.client.findUnique({ where: { portalUserId: match.id } });
          if (
            !already &&
            (match.role === UserRole.MARKETPLACE_SEEKER || match.role === UserRole.CLIENT)
          ) {
            await tx.user.update({
              where: { id: match.id },
              data: { role: UserRole.CLIENT },
            });
            portalUserId = match.id;
          }
        }
      }

      const client = await tx.client.create({
        data: {
          clientRef,
          firstName: lead.firstName,
          lastName: lead.lastName,
          phone: lead.phone,
          email: lead.email,
          preferences: lead.preferences,
          convertedFromLeadId: lead.id,
          portalUserId,
        },
      });

      if (lead.listingId) {
        await tx.listing.update({
          where: { id: lead.listingId },
          data: { status: ListingStatus.RESERVED },
        });
      }

      await tx.lead.update({
        where: { id },
        data: {
          stage: LeadStage.WON,
          stageUpdatedAt: new Date(),
        },
      });

      return tx.lead.findUnique({
        where: { id },
        include: {
          ...leadInclude,
          client: {
            select: {
              id: true,
              clientRef: true,
              firstName: true,
              lastName: true,
              portalUserId: true,
              portalUser: { select: portalUserSelect },
            },
          },
        },
      });
    });
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

  private assertCanCreate(user: AuthUser) {
    const allowed: UserRole[] = [UserRole.SALES, UserRole.CEO, UserRole.ADMIN];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only sales can manage CRM leads');
    }
  }
}
