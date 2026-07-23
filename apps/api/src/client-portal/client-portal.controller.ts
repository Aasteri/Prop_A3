import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
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
}
