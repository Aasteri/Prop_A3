import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { AcknowledgeEthicsDto } from './dto/ethics.dto';
import {
  ETHICS_PRINCIPLES,
  ETHICS_QUOTE,
  ETHICS_VERSION,
} from './ethics.principles';

@Injectable()
export class EthicsService {
  constructor(private readonly prisma: PrismaService) {}

  principles() {
    return {
      version: ETHICS_VERSION,
      principles: ETHICS_PRINCIPLES,
      quote: ETHICS_QUOTE,
      company: 'TRIPLE A REALTY PROJECTS LTD.',
    };
  }

  async me(user: AuthUser) {
    const ack = await this.prisma.ethicsAcknowledgement.findUnique({
      where: {
        userId_version: { userId: user.id, version: ETHICS_VERSION },
      },
    });
    return {
      version: ETHICS_VERSION,
      acknowledged: !!ack,
      acknowledgedAt: ack?.acknowledgedAt ?? null,
      notes: ack?.notes ?? null,
    };
  }

  async acknowledge(user: AuthUser, dto: AcknowledgeEthicsDto) {
    const ack = await this.prisma.ethicsAcknowledgement.upsert({
      where: {
        userId_version: { userId: user.id, version: ETHICS_VERSION },
      },
      create: {
        userId: user.id,
        version: ETHICS_VERSION,
        notes: dto.notes,
        acknowledgedAt: new Date(),
      },
      update: {
        notes: dto.notes,
        acknowledgedAt: new Date(),
      },
    });
    return {
      version: ETHICS_VERSION,
      acknowledged: true,
      acknowledgedAt: ack.acknowledgedAt,
      notes: ack.notes,
    };
  }

  async status(user: AuthUser, userId?: string) {
    this.assertCanViewStatus(user);
    const where = userId
      ? { userId, version: ETHICS_VERSION }
      : { version: ETHICS_VERSION };
    const rows = await this.prisma.ethicsAcknowledgement.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { acknowledgedAt: 'desc' },
    });
    return {
      version: ETHICS_VERSION,
      acknowledgements: rows.map((r) => ({
        userId: r.userId,
        acknowledgedAt: r.acknowledgedAt,
        notes: r.notes,
        user: r.user,
      })),
    };
  }

  private assertCanViewStatus(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
