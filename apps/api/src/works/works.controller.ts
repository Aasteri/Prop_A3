import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CreateWorksContractDto, UpdateWorksStatusDto } from './dto/works.dto';
import { WorksService } from './works.service';

@Controller('works')
@UseGuards(JwtAuthGuard)
export class WorksController {
  constructor(private readonly works: WorksService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.works.findAll(user);
  }

  @Post()
  create(@Body() dto: CreateWorksContractDto, @CurrentUser() user: AuthUser) {
    return this.works.create(dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorksStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.works.updateStatus(id, dto, user);
  }
}
