import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateInstalmentPlanDto,
  RecordInstalmentPaymentDto,
} from './dto/instalment.dto';
import { InstalmentsService } from './instalments.service';

@Controller('instalments')
@UseGuards(JwtAuthGuard)
export class InstalmentsController {
  constructor(private readonly instalments: InstalmentsService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.instalments.summary(user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.instalments.findAll(user, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.instalments.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateInstalmentPlanDto, @CurrentUser() user: AuthUser) {
    return this.instalments.create(dto, user);
  }

  @Post('flag-missed')
  flagMissed(@CurrentUser() user: AuthUser) {
    return this.instalments.flagMissed(user);
  }

  @Patch('lines/:lineId/pay')
  recordPayment(
    @Param('lineId') lineId: string,
    @Body() dto: RecordInstalmentPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.instalments.recordPayment(lineId, dto, user);
  }
}
