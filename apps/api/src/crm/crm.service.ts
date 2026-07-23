import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadSource, LeadStage, ListingStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateLeadDto,
  PublicInquiryDto,
  UpdateLeadDto,
  UpdateLeadStageDto,
} from './dto/lead.dto';
import {
  generateClientRef,
  generateLeadRef,
  nextStages,
  PIPELINE_STAGES,
  stageLabel,
} from './crm.utils';

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
  constructor(private readonly prisma: PrismaService) {}

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
    return {
      ...lead,
      nextStages: nextStages(lead.stage),
    };
  }

  listClients(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.client.findMany({
      include: {
        lead: {
          select: {
            id: true,
            leadRef: true,
            listing: { select: { listingRef: true, location: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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

  createPublicInquiry(dto: PublicInquiryDto) {
    return this.createLead(
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
    ).then(async (lead) => {
      if (dto.utmSource || dto.utmCampaign) {
        return this.prisma.lead.update({
          where: { id: lead.id },
          data: { utmSource: dto.utmSource, utmCampaign: dto.utmCampaign },
          include: leadInclude,
        });
      }
      return lead;
    });
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
      lead.stage !== LeadStage.INQUIRY &&
      lead.stage !== LeadStage.CONTACTED &&
      lead.stage !== LeadStage.VIEWING
    ) {
      throw new BadRequestException('Lead cannot be converted from current stage');
    }

    return this.prisma.$transaction(async (tx) => {
      const clientRef = await generateClientRef(tx);

      const client = await tx.client.create({
        data: {
          clientRef,
          firstName: lead.firstName,
          lastName: lead.lastName,
          phone: lead.phone,
          email: lead.email,
          preferences: lead.preferences,
          convertedFromLeadId: lead.id,
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
            select: { id: true, clientRef: true, firstName: true, lastName: true },
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
