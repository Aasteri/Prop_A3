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
import { CreateTenancyOfferDto } from './dto/offer.dto';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('applicationId') applicationId?: string) {
    if (!applicationId) return [];
    return this.offers.findByApplication(applicationId, user);
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
      'Content-Disposition': `attachment; filename="offer-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.offers.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateTenancyOfferDto, @CurrentUser() user: AuthUser) {
    return this.offers.create(dto, user);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.offers.accept(id, user);
  }
}
