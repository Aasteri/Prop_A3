import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

class PurgeDemoDto {
  @IsString()
  @MinLength(5)
  confirm!: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post('purge-demo-data')
  purgeDemoData(@CurrentUser() user: AuthUser, @Body() dto: PurgeDemoDto) {
    if (dto.confirm !== 'PURGE DEMO DATA') {
      return { ok: false, message: 'Type PURGE DEMO DATA exactly to confirm.' };
    }
    return this.admin.purgeDemoData(user);
  }
}
