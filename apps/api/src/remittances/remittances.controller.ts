import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CreateRemittanceDto, MarkRemittancePaidDto } from './dto/remittance.dto';
import { RemittancesService } from './remittances.service';

@Controller('remittances')
@UseGuards(JwtAuthGuard)
export class RemittancesController {
  constructor(private readonly remittances: RemittancesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.remittances.findAll(user);
  }

  @Get('preview')
  preview(
    @CurrentUser() user: AuthUser,
    @Query('propertyId') propertyId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.remittances.preview(user, propertyId, periodStart, periodEnd);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.remittances.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="remittance-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.remittances.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateRemittanceDto, @CurrentUser() user: AuthUser) {
    return this.remittances.create(dto, user);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.remittances.approve(id, user);
  }

  @Patch(':id/paid')
  markPaid(
    @Param('id') id: string,
    @Body() dto: MarkRemittancePaidDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.remittances.markPaid(id, dto, user);
  }
}
