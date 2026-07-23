import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateTerrierRowDto,
  UpdateTerrierRowDto,
  VacateTerrierRowDto,
} from './dto/estate-terrier.dto';
import { EstateTerrierService } from './estate-terrier.service';

@Controller('estate-terrier')
@UseGuards(JwtAuthGuard)
export class EstateTerrierController {
  constructor(private readonly terrier: EstateTerrierService) {}

  @Get('estates')
  findEstates(@CurrentUser() user: AuthUser) {
    return this.terrier.findEstates(user);
  }

  @Get('estates/:estateId/vacant-units')
  vacantUnits(@Param('estateId') estateId: string, @CurrentUser() user: AuthUser) {
    return this.terrier.listVacantRows(estateId, user);
  }

  @Get('estates/:estateId')
  register(@Param('estateId') estateId: string, @CurrentUser() user: AuthUser) {
    return this.terrier.findEstateRegister(estateId, user);
  }

  @Post('rows')
  createRow(@Body() dto: CreateTerrierRowDto, @CurrentUser() user: AuthUser) {
    return this.terrier.createRow(dto, user);
  }

  @Patch('rows/:id')
  updateRow(
    @Param('id') id: string,
    @Body() dto: UpdateTerrierRowDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.terrier.updateRow(id, dto, user);
  }

  @Post('rows/:id/vacate')
  vacateRow(
    @Param('id') id: string,
    @Body() dto: VacateTerrierRowDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.terrier.vacateRow(id, dto, user);
  }
}
