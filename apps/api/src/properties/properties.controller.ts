import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreatePropertyDto,
  ListPropertiesQueryDto,
  UpdatePropertyDto,
} from './dto/property.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListPropertiesQueryDto) {
    return this.properties.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.properties.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: AuthUser) {
    return this.properties.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.properties.update(id, dto, user);
  }
}
