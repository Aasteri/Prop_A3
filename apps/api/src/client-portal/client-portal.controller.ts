import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CreateMaintenanceDto } from '../maintenance/dto/maintenance.dto';
import { ClientPortalService } from './client-portal.service';

@Controller('client-portal')
@UseGuards(JwtAuthGuard)
export class ClientPortalController {
  constructor(private readonly portal: ClientPortalService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.portal.dashboard(user);
  }

  @Get('projects/:projectId/progress')
  progress(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.portal.projectProgress(projectId, user);
  }

  @Get('invoices')
  invoices(@CurrentUser() user: AuthUser) {
    return this.portal.invoices(user);
  }

  @Get('changes')
  changes(@CurrentUser() user: AuthUser) {
    return this.portal.changeOrders(user);
  }

  @Get('documents')
  documents(@CurrentUser() user: AuthUser) {
    return this.portal.documents(user);
  }

  @Get('maintenance/properties')
  maintenanceProperties(@CurrentUser() user: AuthUser) {
    return this.portal.portalMaintenanceProperties(user);
  }

  @Get('maintenance')
  maintenanceList(@CurrentUser() user: AuthUser) {
    return this.portal.portalMaintenanceList(user);
  }

  @Post('maintenance')
  maintenanceCreate(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: AuthUser) {
    return this.portal.portalMaintenanceCreate(dto, user);
  }

  @Patch('maintenance/work-orders/:id/confirm')
  confirmWorkOrder(
    @Param('id') id: string,
    @Body()
    dto: {
      tenantSatisfied?: boolean;
      tenantRating?: number;
      tenantFeedback?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.portal.portalConfirmWorkOrder(id, dto, user);
  }
}
