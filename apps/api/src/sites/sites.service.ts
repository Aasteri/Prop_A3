import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser) {
    if (user.role === UserRole.CEO || user.role === UserRole.ADMIN) {
      return this.prisma.site.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      });
    }

    if (!user.siteIds.length) return [];

    return this.prisma.site.findMany({
      where: { id: { in: user.siteIds }, isActive: true },
      orderBy: { code: 'asc' },
    });
  }
}
