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
import { CreateSalesOfferDto, RespondSalesOfferDto } from './dto/sales-offer.dto';
import { SalesOffersService } from './sales-offers.service';

@Controller('sales-offers')
@UseGuards(JwtAuthGuard)
export class SalesOffersController {
  constructor(private readonly offers: SalesOffersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('leadId') leadId?: string) {
    if (!leadId) return [];
    return this.offers.findByLead(leadId, user);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.offers.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sof-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.offers.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateSalesOfferDto, @CurrentUser() user: AuthUser) {
    return this.offers.create(dto, user);
  }

  @Patch(':id/respond')
  respond(
    @Param('id') id: string,
    @Body() dto: RespondSalesOfferDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offers.respond(id, dto, user);
  }
}
