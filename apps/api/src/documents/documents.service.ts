import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DocumentCategory,
  DocumentEntityType,
  UserRole,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { buildAllocationLetterPdf } from './allocation-letter.pdf';
import { GenerateAllocationDto } from './dto/generate-allocation.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  private readonly uploadRoot = path.join(process.cwd(), '..', '..', 'uploads', 'documents');

  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: AuthUser,
    filters?: { entityType?: DocumentEntityType; entityId?: string; category?: DocumentCategory },
  ) {
    const docs = await this.prisma.document.findMany({
      where: {
        isLatest: true,
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
        ...(filters?.entityId ? { entityId: filters.entityId } : {}),
        ...(filters?.category ? { category: filters.category } : {}),
      },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    const visible: typeof docs = [];
    for (const doc of docs) {
      if (await this.canView(user, doc.entityType, doc.entityId)) {
        visible.push(doc);
      }
    }
    return visible;
  }

  async findVersions(id: string, user: AuthUser) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.assertCanView(user, doc.entityType, doc.entityId);

    return this.prisma.document.findMany({
      where: {
        entityType: doc.entityType,
        entityId: doc.entityId,
        category: doc.category,
      },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { version: 'desc' },
    });
  }

  async upload(dto: UploadDocumentDto, file: Express.Multer.File, user: AuthUser) {
    await this.assertCanUpload(user, dto.entityType, dto.entityId, dto.category);
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }

    const latest = await this.prisma.document.findFirst({
      where: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        category: dto.category,
        isLatest: true,
      },
      orderBy: { version: 'desc' },
    });

    const version = (latest?.version ?? 0) + 1;
    const ext = path.extname(file.originalname) || '.pdf';
    const safeName = `${dto.category.toLowerCase()}-v${version}${ext}`;
    const relDir = path.join(dto.entityType.toLowerCase(), dto.entityId);
    const absDir = path.join(this.uploadRoot, relDir);
    fs.mkdirSync(absDir, { recursive: true });
    fs.writeFileSync(path.join(absDir, safeName), file.buffer);

    const fileUrl = `/uploads/documents/${relDir.replace(/\\/g, '/')}/${safeName}`;

    if (latest) {
      await this.prisma.document.update({
        where: { id: latest.id },
        data: { isLatest: false },
      });
    }

    const document = await this.prisma.document.create({
      data: {
        category: dto.category,
        entityType: dto.entityType,
        entityId: dto.entityId,
        title: dto.title,
        version,
        isLatest: true,
        fileUrl,
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedById: user.id,
        notes: dto.notes,
      },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (dto.category === DocumentCategory.PERMIT && dto.entityType === DocumentEntityType.PROJECT) {
      await this.prisma.project.update({
        where: { id: dto.entityId },
        data: { fcdaPermitUrl: fileUrl },
      });
    }

    return document;
  }

  /** Used by legacy FCDA endpoint — same as upload with PERMIT category. */
  async uploadFcdaPermit(projectId: string, file: Express.Multer.File, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { site: true, milestones: { orderBy: { stage: 'asc' } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.assertProjectSiteAccess(user, project.siteId);

    await this.upload(
      {
        entityType: DocumentEntityType.PROJECT,
        entityId: projectId,
        category: DocumentCategory.PERMIT,
        title: 'FCDA Permit',
      },
      file,
      user,
    );

    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: { site: true, milestones: { orderBy: { stage: 'asc' } } },
    });
  }

  async generateAllocationLetter(dto: GenerateAllocationDto, user: AuthUser) {
    if (
      user.role !== UserRole.SALES &&
      user.role !== UserRole.FINANCE &&
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Not allowed to generate allocation letters');
    }

    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) throw new NotFoundException('Client not found');

    const link = await this.prisma.clientProject.findUnique({
      where: { clientId_projectId: { clientId: dto.clientId, projectId: dto.projectId } },
    });
    if (!link) throw new BadRequestException('Client is not linked to this project');

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: {
        site: true,
        projectManager: { select: { firstName: true, lastName: true, phone: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.assertProjectSiteAccess(user, project.siteId);

    const pdf = await buildAllocationLetterPdf({
      date: new Date(),
      clientName: `${client.firstName} ${client.lastName}`,
      clientAddress: client.address ?? 'Abuja, Nigeria',
      plotType: link.plotRef ? 'Plot' : 'Unit',
      estateName: project.name,
      area: project.location ?? project.site.name,
      plotNumber: link.plotRef ?? 'TBC',
      propertyType: project.projectNumber ?? 'Residential',
      sqm: 'TBC',
      phase: project.site.code,
      contractRef: project.contractRef ?? 'TBC',
      pmName: project.projectManager
        ? `${project.projectManager.firstName} ${project.projectManager.lastName}`
        : 'Project Manager',
      pmPhone: project.projectManager?.phone ?? 'N/A',
    });

    const fakeFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: `allocation-${client.clientRef}.pdf`,
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: pdf.length,
      buffer: pdf,
      stream: undefined as never,
      destination: '',
      filename: '',
      path: '',
    };

    return this.upload(
      {
        entityType: DocumentEntityType.CLIENT,
        entityId: dto.clientId,
        category: DocumentCategory.ALLOCATION_LETTER,
        title: `Allocation Letter — ${project.name}`,
        notes: `Project: ${project.id}`,
      },
      fakeFile,
      user,
    );
  }

  async clientDocuments(user: AuthUser) {
    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Client portal access only');
    }
    const client = await this.prisma.client.findUnique({ where: { portalUserId: user.id } });
    if (!client) throw new ForbiddenException('No client profile linked');

    const projectIds = (
      await this.prisma.clientProject.findMany({
        where: { clientId: client.id },
        select: { projectId: true },
      })
    ).map((p) => p.projectId);

    return this.prisma.document.findMany({
      where: {
        isLatest: true,
        OR: [
          { entityType: DocumentEntityType.CLIENT, entityId: client.id },
          {
            entityType: DocumentEntityType.PROJECT,
            entityId: { in: projectIds },
            category: {
              in: [
                DocumentCategory.ALLOCATION_LETTER,
                DocumentCategory.CONTRACT,
                DocumentCategory.CERTIFICATE,
                DocumentCategory.DRAWING,
              ],
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async canView(user: AuthUser, entityType: DocumentEntityType, entityId: string) {
    try {
      await this.assertCanView(user, entityType, entityId);
      return true;
    } catch {
      return false;
    }
  }

  private async assertCanView(user: AuthUser, entityType: DocumentEntityType, entityId: string) {
    if (user.role === UserRole.CEO || user.role === UserRole.ADMIN) return;

    if (entityType === DocumentEntityType.PROJECT) {
      const project = await this.prisma.project.findUnique({ where: { id: entityId } });
      if (!project) throw new NotFoundException('Project not found');
      await this.assertProjectSiteAccess(user, project.siteId);
      return;
    }

    if (entityType === DocumentEntityType.CLIENT) {
      if (user.role === UserRole.CLIENT) {
        const client = await this.prisma.client.findUnique({ where: { portalUserId: user.id } });
        if (!client || client.id !== entityId) {
          throw new ForbiddenException('Access denied');
        }
        return;
      }
      if (
        user.role === UserRole.FINANCE ||
        user.role === UserRole.SALES ||
        user.role === UserRole.PROJECT_MANAGER
      ) {
        return;
      }
      throw new ForbiddenException('Access denied');
    }

    if (entityType === DocumentEntityType.TENANT) {
      if (
        user.role === UserRole.PROJECT_MANAGER ||
        user.role === UserRole.FINANCE ||
        user.role === UserRole.SALES
      ) {
        return;
      }
      throw new ForbiddenException('Access denied');
    }
  }

  private async assertCanUpload(
    user: AuthUser,
    entityType: DocumentEntityType,
    entityId: string,
    category: DocumentCategory,
  ) {
    if (category === DocumentCategory.PERMIT && entityType === DocumentEntityType.PROJECT) {
      if (
        user.role !== UserRole.PROJECT_MANAGER &&
        user.role !== UserRole.CEO &&
        user.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Only PM can upload FCDA permit');
      }
    } else if (entityType === DocumentEntityType.CLIENT) {
      if (
        user.role !== UserRole.FINANCE &&
        user.role !== UserRole.SALES &&
        user.role !== UserRole.PROJECT_MANAGER &&
        user.role !== UserRole.CEO &&
        user.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Not allowed to upload client documents');
      }
    } else if (entityType === DocumentEntityType.PROJECT) {
      if (
        user.role !== UserRole.PROJECT_MANAGER &&
        user.role !== UserRole.ENGINEER &&
        user.role !== UserRole.FINANCE &&
        user.role !== UserRole.CEO &&
        user.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Not allowed to upload project documents');
      }
    } else {
      if (
        user.role !== UserRole.PROJECT_MANAGER &&
        user.role !== UserRole.CEO &&
        user.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Not allowed to upload tenant documents');
      }
    }

    await this.assertCanView(user, entityType, entityId);
  }

  private async assertProjectSiteAccess(user: AuthUser, siteId: string) {
    if (user.role === UserRole.CEO || user.role === UserRole.ADMIN) return;
    if (!user.siteIds.length) return;
    if (!user.siteIds.includes(siteId)) {
      throw new ForbiddenException('No access to this site');
    }
  }
}
