import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryKind, InventoryStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CompleteInventoryDto, CreateInventoryDto } from './dto/inventory.dto';

const include = {
  tenancy: {
    select: {
      id: true,
      tenantName: true,
      agreementNo: true,
      property: { select: { id: true, name: true, address: true } },
      unit: { select: { unitCode: true } },
    },
  },
};

@Injectable()
export class InventoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, tenancyId?: string) {
    this.assertCanView(user);
    return this.prisma.propertyInventory.findMany({
      where: tenancyId ? { tenancyId } : undefined,
      include,
      orderBy: { inspectedAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.propertyInventory.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Inventory not found');
    return row;
  }

  async create(dto: CreateInventoryDto, user: AuthUser) {
    this.assertCanManage(user);
    const tenancy = await this.prisma.tenancy.findUnique({ where: { id: dto.tenancyId } });
    if (!tenancy) throw new NotFoundException('Tenancy not found');

    const inspectedAt = new Date(dto.inspectedAt);
    const discrepancyDeadline =
      dto.kind === InventoryKind.MOVE_IN
        ? new Date(inspectedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
        : null;

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    const prefix = dto.kind === InventoryKind.MOVE_IN ? 'INV-IN' : 'INV-OUT';

    return this.prisma.propertyInventory.create({
      data: {
        number: `${prefix}-${year}-${stamp}`,
        tenancyId: dto.tenancyId,
        kind: dto.kind,
        inspectedAt,
        inspectedBy: dto.inspectedBy,
        moveDate: dto.moveDate ? new Date(dto.moveDate) : undefined,
        photoEvidence: dto.photoEvidence ?? false,
        videoEvidence: dto.videoEvidence ?? false,
        frontDoorKeys: dto.frontDoorKeys,
        backDoorKeys: dto.backDoorKeys,
        electricMeterNo: dto.electricMeterNo,
        electricReading: dto.electricReading,
        waterMeterNo: dto.waterMeterNo,
        waterReading: dto.waterReading,
        notes: dto.notes,
        roomsJson: dto.roomsJson as never,
        discrepancyDeadline: discrepancyDeadline ?? undefined,
        status: InventoryStatus.DRAFT,
      },
      include,
    });
  }

  async complete(id: string, dto: CompleteInventoryDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.propertyInventory.update({
      where: { id },
      data: {
        landlordSigned: dto.landlordSigned ?? true,
        tenantSigned: dto.tenantSigned ?? true,
        status: InventoryStatus.COMPLETED,
      },
      include,
    });
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.SALES,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
