import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { HseService } from './hse.service';

@Controller('hse')
@UseGuards(JwtAuthGuard)
export class HseController {
  constructor(private readonly hse: HseService) {}

  @Get('incidents')
  list(@CurrentUser() user: AuthUser) {
    const isCeo = user.role === UserRole.CEO || user.role === UserRole.ADMIN;
    return this.hse.findAll(user.siteIds, isCeo);
  }
}
