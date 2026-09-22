import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ProjectOpsService } from './project-ops.service';

@Controller('project-ops')
@UseGuards(JwtAuthGuard)
export class ProjectOpsController {
  constructor(private readonly ops: ProjectOpsService) {}

  @Get('field-map')
  fieldMap(@CurrentUser() user: AuthUser) {
    return this.ops.getFieldMap(user);
  }

  @Get('qc-plans')
  listQc(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.ops.listQcPlans(user, projectId);
  }

  @Post('qc-plans')
  createQc(@Body() body: Parameters<ProjectOpsService['createQcPlan']>[0], @CurrentUser() user: AuthUser) {
    return this.ops.createQcPlan(body, user);
  }

  @Patch('qc-plans/:id/status')
  qcStatus(
    @Param('id') id: string,
    @Body() body: { status: 'DRAFT' | 'ACTIVE' | 'COMPLETE' },
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.updateQcPlanStatus(id, body.status, user);
  }

  @Patch('sites/:id/coords')
  siteCoords(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number },
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.updateSiteCoords(id, body, user);
  }

  @Get('projects/:projectId/trackers')
  trackers(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.ops.getTrackers(projectId, user);
  }

  @Get('projects/:projectId/workforce')
  workforce(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.ops.listWorkforce(projectId, user);
  }

  @Post('projects/:projectId/workforce')
  createWorkforce(
    @Param('projectId') projectId: string,
    @Body() body: Parameters<ProjectOpsService['createWorkforce']>[1],
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.createWorkforce(projectId, body, user);
  }

  @Delete('workforce/:id')
  deleteWorkforce(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ops.deleteWorkforce(id, user);
  }

  @Get('projects/:projectId/finance')
  finance(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.ops.getFinance(projectId, user);
  }

  @Get('projects/:projectId/finance.pdf')
  async financePdf(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.ops.getFinancePdf(projectId, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="finance-${projectId}.pdf"`,
    });
    res.send(buf);
  }

  @Get('projects/:projectId/finance.csv')
  @Header('Content-Type', 'text/csv')
  async financeCsv(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.ops.getFinanceCsv(projectId, user);
  }

  @Patch('projects/:projectId/budget')
  budget(
    @Param('projectId') projectId: string,
    @Body() body: { budgetAmount: number | null },
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.setBudget(projectId, body.budgetAmount, user);
  }

  @Get('projects/:projectId/analysis')
  analysis(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.ops.getAnalysis(projectId, user);
  }

  @Get('projects/:projectId/analysis.pdf')
  async analysisPdf(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.ops.getAnalysisPdf(projectId, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="analysis-${projectId}.pdf"`,
    });
    res.send(buf);
  }
}
