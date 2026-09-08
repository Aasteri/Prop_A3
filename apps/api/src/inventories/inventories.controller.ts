import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CompleteInventoryDto, CreateInventoryDto } from './dto/inventory.dto';
import { InventoriesService } from './inventories.service';

@Controller('inventories')
@UseGuards(JwtAuthGuard)
export class InventoriesController {
  constructor(private readonly inventories: InventoriesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('tenancyId') tenancyId?: string) {
    return this.inventories.findAll(user, tenancyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.inventories.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateInventoryDto, @CurrentUser() user: AuthUser) {
    return this.inventories.create(dto, user);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteInventoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventories.complete(id, dto, user);
  }
}
