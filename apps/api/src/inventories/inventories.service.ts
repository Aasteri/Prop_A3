import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryKind, InventoryStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CompleteInventoryDto,
  CreateInventoryDto,
  UpdateInventoryDto,
} from './dto/inventory.dto';
import {
  buildEmptyInventoryRooms,
  collectDefectLines,
} from './inventory-rooms.constants';

const include = {
  tenancy: {
    select: {
      id: true,
      tenantName: true,
      agreementNo: true,
      status: true,
      propertyId: true,
      property: { select: { id: true, name: true, address: true } },
      unit: { select: { unitCode: true } },
    },
  },
  preMoveMaintenance: {
    select: {
      id: true,
      number: true,
      status: true,
      component: true,
      estimatedCost: true,
      description: true,
    },
  },
};

@Injectable()
export class InventoriesService {
  constructor(private readonly prisma: PrismaService) {}

  meta() {
    return {
      abbreviations: buildEmptyInventoryRooms().abbreviations,
      emptyMatrix: buildEmptyInventoryRooms(),
    };
  }

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
        roomsJson: (dto.roomsJson ?? buildEmptyInventoryRooms()) as never,
        discrepancyDeadline: discrepancyDeadline ?? undefined,
        status: InventoryStatus.DRAFT,
      },
      include,
    });
  }

  async update(id: string, dto: UpdateInventoryDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status === InventoryStatus.COMPLETED) {
      throw new BadRequestException('Completed inventory cannot be edited');
    }
    return this.prisma.propertyInventory.update({
      where: { id },
      data: {
        inspectedBy: dto.inspectedBy,
        moveDate: dto.moveDate ? new Date(dto.moveDate) : undefined,
        photoEvidence: dto.photoEvidence,
        videoEvidence: dto.videoEvidence,
        frontDoorKeys: dto.frontDoorKeys,
        backDoorKeys: dto.backDoorKeys,
        electricMeterNo: dto.electricMeterNo,
        electricReading: dto.electricReading,
        waterMeterNo: dto.waterMeterNo,
        waterReading: dto.waterReading,
        notes: dto.notes,
        roomsJson: dto.roomsJson !== undefined ? (dto.roomsJson as never) : undefined,
      },
      include,
    });
  }

  async complete(id: string, dto: CompleteInventoryDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    const updated = await this.prisma.propertyInventory.update({
      where: { id },
      data: {
        landlordSigned: dto.landlordSigned ?? true,
        tenantSigned: dto.tenantSigned ?? true,
        status: InventoryStatus.COMPLETED,
      },
      include,
    });

    const shouldSpawn =
      existing.kind === InventoryKind.MOVE_IN && dto.spawnPreMoveRepairs !== false;
    if (shouldSpawn) {
      await this.spawnPreMoveRepairs(updated.id, user);
    }

    if (existing.kind === InventoryKind.MOVE_IN) {
      await this.prisma.tenancy.updateMany({
        where: {
          id: existing.tenancyId,
          status: { in: ['DRAFT', 'PENDING_MOVE_IN'] },
        },
        data: { status: 'PENDING_MOVE_IN' },
      });
    }

    return this.findOne(id, user);
  }

  async spawnPreMoveRepairs(inventoryId: string, user: AuthUser) {
    this.assertCanManage(user);
    const inventory = await this.prisma.propertyInventory.findUnique({
      where: { id: inventoryId },
      include: {
        tenancy: true,
        preMoveMaintenance: true,
      },
    });
    if (!inventory) throw new NotFoundException('Inventory not found');
    if (inventory.kind !== InventoryKind.MOVE_IN) {
      throw new BadRequestException('Pre-move repairs only apply to move-in inventories');
    }

    const defects = collectDefectLines(inventory.roomsJson);
    const created = [];
    for (const d of defects) {
      const already = inventory.preMoveMaintenance.some(
        (m) => m.component === `${d.section} · ${d.item}`,
      );
      if (already) continue;

      const year = new Date().getFullYear();
      const stamp = Date.now().toString(36).toUpperCase().slice(-5);
      const row = await this.prisma.maintenanceRequest.create({
        data: {
          number: `MR-PMI-${year}-${stamp}`,
          propertyId: inventory.tenancy.propertyId,
          tenancyId: inventory.tenancyId,
          inventoryId: inventory.id,
          phase: 'PRE_MOVE_IN',
          unitLabel: undefined,
          tenantName: inventory.tenancy.tenantName,
          tenantPhone: inventory.tenancy.tenantPhone,
          category: 'Pre-move-in',
          component: `${d.section} · ${d.item}`,
          description: `Pre-move-in repair (G.8): ${d.defects}`,
          urgency: d.cost > 0 ? 'HIGH' : 'MEDIUM',
          estimatedCost: d.cost || undefined,
          responsibility: 'LANDLORD',
          status: 'ESCALATED_LANDLORD',
        },
      });
      created.push(row);
      // tiny delay stamp uniqueness
      await new Promise((r) => setTimeout(r, 2));
    }
    return { created: created.length, requests: created };
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
