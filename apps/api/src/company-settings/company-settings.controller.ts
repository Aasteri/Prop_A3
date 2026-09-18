import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { UpdateCompanySettingsDto } from './dto/company-settings.dto';
import { CompanySettingsService } from './company-settings.service';

@Controller('company-settings')
@UseGuards(JwtAuthGuard)
export class CompanySettingsController {
  constructor(private readonly settings: CompanySettingsService) {}

  /** Any authenticated staff — read company fee/bank standards. */
  @Get()
  get() {
    return this.settings.get();
  }

  /** CEO / ADMIN only — update fees and bank identity; syncs seed-triplea. */
  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateCompanySettingsDto) {
    return this.settings.update(dto, user);
  }
}
