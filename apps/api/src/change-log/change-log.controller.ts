import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ChangeLogService } from './change-log.service';
import {
  CreateChangeLogDto,
  RejectChangeLogDto,
  UpdateChangeLogDto,
} from './dto/change-log.dto';

@Controller('change-log')
@UseGuards(JwtAuthGuard)
export class ChangeLogController {
  constructor(private readonly changeLog: ChangeLogService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.changeLog.findAll(user, projectId);
  }

  @Get('export/:projectId')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="project-change-log.csv"')
  exportCsv(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.changeLog.exportCsv(projectId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.changeLog.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateChangeLogDto, @CurrentUser() user: AuthUser) {
    return this.changeLog.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChangeLogDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.changeLog.update(id, dto, user);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.changeLog.submitForReview(id, user);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.changeLog.approve(id, user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectChangeLogDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.changeLog.reject(id, dto, user);
  }
}
