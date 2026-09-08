import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { purgeDemoData, type PurgeDemoDataResult } from './purge-demo-data';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  assertAdmin(user: AuthUser) {
    if (user.role !== UserRole.CEO && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access only (CEO or Admin role)');
    }
  }

  async purgeDemoData(user: AuthUser): Promise<PurgeDemoDataResult & { message: string }> {
    this.assertAdmin(user);
    const result = await purgeDemoData(this.prisma);
    return {
      ...result,
      message:
        'Demo data cleared. Staff accounts and site definitions (JKW, MPP, GZ2, GZ3) were kept.',
    };
  }
}
