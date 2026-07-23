import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { MilestonesService } from './milestones.service';
import { CertifyMilestoneDto, UpdateMilestoneProgressDto } from './dto/milestone.dto';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestones: MilestonesService) {}

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.milestones.findByProject(projectId, user);
  }

  @Patch(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneProgressDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.milestones.updateProgress(id, dto, user);
  }

  @Post(':id/certify')
  certify(
    @Param('id') id: string,
    @Body() dto: CertifyMilestoneDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.milestones.certify(id, dto, user);
  }
}
