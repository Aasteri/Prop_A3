import { Controller, ForbiddenException, Get, Query, UseGuards } from '@nestjs/common';
import { AuditEntityType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('entityType') entityType?: AuditEntityType,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
  ) {
    if (
      user.role !== UserRole.CEO &&
      user.role !== UserRole.FINANCE &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Audit log access restricted to CEO, Finance, and Admin');
    }

    return this.audit.findAll({
      entityType,
      entityId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
