import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ProjectsService {
  private readonly fcdaDir = path.join(process.cwd(), '..', '..', 'uploads', 'fcda');

  constructor(private readonly prisma: PrismaService) {}

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
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }

    fs.mkdirSync(this.fcdaDir, { recursive: true });
    const ext = path.extname(file.originalname) || '.pdf';
    const filename = `${project.id}-fcda${ext}`;
    fs.writeFileSync(path.join(this.fcdaDir, filename), file.buffer);

    return this.prisma.project.update({
      where: { id: project.id },
      data: { fcdaPermitUrl: `/uploads/fcda/${filename}` },
      include: {
        site: true,
        milestones: { orderBy: { stage: 'asc' } },
      },
    });
  }
}
