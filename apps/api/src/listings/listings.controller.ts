import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateListingDto,
  ListListingsQueryDto,
  UpdateListingDto,
} from './dto/listing.dto';
import { ListingsService } from './listings.service';
import { LISTING_FINISHES, LISTING_STATUSES, LISTING_TYPES } from './listings.utils';

@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get('meta')
  meta() {
    return {
      statuses: LISTING_STATUSES,
      finishes: LISTING_FINISHES,
      types: LISTING_TYPES,
    };
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListListingsQueryDto) {
    return this.listings.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.listings.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateListingDto, @CurrentUser() user: AuthUser) {
    return this.listings.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.listings.update(id, dto, user);
  }
}
