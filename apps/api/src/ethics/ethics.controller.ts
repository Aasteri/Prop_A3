import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AcknowledgeEthicsDto } from './dto/ethics.dto';
import { EthicsService } from './ethics.service';

@Controller('ethics')
@UseGuards(JwtAuthGuard)
export class EthicsController {
  constructor(private readonly ethics: EthicsService) {}

  @Get('principles')
  principles() {
    return this.ethics.principles();
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.ethics.me(user);
  }

  @Post('acknowledge')
  acknowledge(@CurrentUser() user: AuthUser, @Body() dto: AcknowledgeEthicsDto) {
    return this.ethics.acknowledge(user, dto);
  }

  @Get('status')
  status(@CurrentUser() user: AuthUser, @Query('userId') userId?: string) {
    return this.ethics.status(user, userId);
  }
}
