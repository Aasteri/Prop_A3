import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateArtisanDto,
  ListArtisansQueryDto,
  PublicArtisanApplyDto,
  UpdateArtisanLocationDto,
  UpdateArtisanStatusDto,
} from './dto/artisan.dto';
import { ArtisansService } from './artisans.service';

@Controller('artisans')
export class ArtisansController {
  constructor(private readonly artisans: ArtisansService) {}

  /** Public — artisan marketplace signup. */
  @Post('apply')
  publicApply(@Body() dto: PublicArtisanApplyDto) {
    return this.artisans.publicApply(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListArtisansQueryDto) {
    return this.artisans.findAll(user, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.artisans.findOne(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateArtisanDto, @CurrentUser() user: AuthUser) {
    return this.artisans.create(dto, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateArtisanStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.artisans.updateStatus(id, dto, user);
  }

  @Patch(':id/location')
  @UseGuards(JwtAuthGuard)
  updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateArtisanLocationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.artisans.updateLocation(id, dto, user);
  }
}
