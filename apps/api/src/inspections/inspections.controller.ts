import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';
import { InspectionsService } from './inspections.service';

@Controller('inspections')
@UseGuards(JwtAuthGuard)
export class InspectionsController {
  constructor(private readonly inspections: InspectionsService) {}

  @Get('meta')
  meta() {
    return this.inspections.meta();
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.inspections.findAll(user, projectId);
  }

  @Post()
  create(@Body() dto: CreateInspectionDto, @CurrentUser() user: AuthUser) {
    return this.inspections.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInspectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspections.update(id, dto, user);
  }
}
