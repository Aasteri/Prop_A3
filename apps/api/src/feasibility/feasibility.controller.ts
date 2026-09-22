import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { FeasibilityDecision } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { FeasibilityService } from './feasibility.service';

@Controller('feasibility')
@UseGuards(JwtAuthGuard)
export class FeasibilityController {
  constructor(private readonly feasibility: FeasibilityService) {}

  @Get(':projectId')
  get(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.feasibility.getBundle(projectId, user);
  }

  @Put(':projectId')
  upsert(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      budgetBand?: string;
      siteNotes?: string;
      clientNeed?: string;
      objectives?: string;
      constraints?: string;
      decision?: FeasibilityDecision;
      notes?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.feasibility.upsertFeasibility(projectId, body, user);
  }

  @Post(':projectId/stakeholders')
  addStakeholder(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      name: string;
      role?: string;
      organisation?: string;
      interest?: string;
      influence?: string;
      contact?: string;
      notes?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.feasibility.addStakeholder(projectId, body, user);
  }

  @Delete('stakeholders/:id')
  deleteStakeholder(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.feasibility.deleteStakeholder(id, user);
  }
}
