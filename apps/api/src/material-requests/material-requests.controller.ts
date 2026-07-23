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
import { MaterialRequestsService } from './material-requests.service';
import {
  ApproveMaterialRequestDto,
  CreateMaterialRequestDto,
  IssueMaterialRequestDto,
  RejectMaterialRequestDto,
  UpdateMaterialRequestDto,
} from './dto/material-request.dto';

@Controller('material-requests')
@UseGuards(JwtAuthGuard)
export class MaterialRequestsController {
  constructor(private readonly materials: MaterialRequestsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.materials.findAll(user, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.materials.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateMaterialRequestDto, @CurrentUser() user: AuthUser) {
    return this.materials.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.materials.update(id, dto, user);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.materials.submit(id, user);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveMaterialRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.materials.approve(id, dto, user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectMaterialRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.materials.reject(id, dto, user);
  }

  @Post(':id/issue')
  issue(
    @Param('id') id: string,
    @Body() dto: IssueMaterialRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.materials.issue(id, dto, user);
  }
}
