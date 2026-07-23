import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

type AuditActor = Pick<AuthUser, 'id' | 'firstName' | 'lastName' | 'email'>;

export type AuditLogParams = {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  summary: string;
  actor?: AuditActor | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(params: AuditLogParams) {
    const actorName = params.actor
      ? `${params.actor.firstName} ${params.actor.lastName}`.trim()
      : undefined;

    return this.prisma.auditEvent.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        summary: params.summary.slice(0, 500),
        actorId: params.actor?.id,
        actorName,
        beforeValue: (params.before ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        afterValue: (params.after ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        metadata: (params.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  }

  findAll(filters?: {
    entityType?: AuditEntityType;
    entityId?: string;
    limit?: number;
  }) {
    const take = Math.min(filters?.limit ?? 100, 500);
    return this.prisma.auditEvent.findMany({
      where: {
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
        ...(filters?.entityId ? { entityId: filters.entityId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
