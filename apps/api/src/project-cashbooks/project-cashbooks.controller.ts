import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CreateCashbookDto, UpdateCashbookDto } from './dto/cashbook.dto';
import { ProjectCashbooksService } from './project-cashbooks.service';

@Controller('project-cashbooks')
@UseGuards(JwtAuthGuard)
export class ProjectCashbooksController {
  constructor(private readonly cashbooks: ProjectCashbooksService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.cashbooks.findAll(user, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.cashbooks.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateCashbookDto, @CurrentUser() user: AuthUser) {
    return this.cashbooks.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCashbookDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.cashbooks.update(id, dto, user);
  }
}
