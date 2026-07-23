import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  findAll(user: AuthUser) {
    const allSites =
      user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      !user.siteIds.length;
    const where = allSites ? {} : { siteId: { in: user.siteIds } };

    return this.prisma.project.findMany({
      where,
      include: {
        site: true,
        milestones: { orderBy: { stage: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string, user: AuthUser) {
    return this.prisma.project.findFirst({
      where: {
        id,
        ...((user.role === UserRole.CEO ||
          user.role === UserRole.ADMIN ||
          !user.siteIds.length)
          ? {}
          : { siteId: { in: user.siteIds } }),
      },
      include: {
        site: true,
        milestones: { orderBy: { stage: 'asc' } },
      },
    });
  }

  async uploadFcdaPermit(id: string, file: Express.Multer.File, user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM can upload FCDA permit');
    }

    const project = await this.findOne(id, user);
    if (!project) throw new NotFoundException('Project not found');

    return this.documents.uploadFcdaPermit(id, file, user);
  }
}
