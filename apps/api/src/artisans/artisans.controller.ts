import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateArtisanDto,
  ListArtisansQueryDto,
  UpdateArtisanStatusDto,
} from './dto/artisan.dto';
import { ArtisansService } from './artisans.service';

@Controller('artisans')
@UseGuards(JwtAuthGuard)
export class ArtisansController {
  constructor(private readonly artisans: ArtisansService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListArtisansQueryDto) {
    return this.artisans.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.artisans.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateArtisanDto, @CurrentUser() user: AuthUser) {
    return this.artisans.create(dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateArtisanStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.artisans.updateStatus(id, dto, user);
  }
}
