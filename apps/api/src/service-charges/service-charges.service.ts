import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { ServiceChargeCreditDto, ServiceChargeDebitDto } from './dto/service-charge.dto';

@Injectable()
export class ServiceChargesService {
  constructor(private readonly prisma: PrismaService) {}

  listAccounts(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.serviceChargeAccount.findMany({
      include: {
        property: { select: { id: true, name: true, code: true, address: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getByProperty(propertyId: string, user: AuthUser) {
    this.assertCanView(user);
    const account = await this.ensureAccount(propertyId);
    const entries = await this.prisma.serviceChargeLedgerEntry.findMany({
      where: { accountId: account.id },
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
    return {
      ...account,
      balanceAvailable: Number(account.balanceAvailable),
      balanceReserved: Number(account.balanceReserved),
      entries: entries.map((e) => ({
        ...e,
        debit: Number(e.debit),
        credit: Number(e.credit),
      })),
    };
  }

  async credit(propertyId: string, dto: ServiceChargeCreditDto, user: AuthUser) {
    this.assertCanManage(user);
    return this.postEntry(propertyId, {
      credit: dto.amount,
      debit: 0,
      description: dto.description,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
    });
  }

  async debit(propertyId: string, dto: ServiceChargeDebitDto, user: AuthUser) {
    this.assertCanManage(user);
    const account = await this.ensureAccount(propertyId);
    const available = Number(account.balanceAvailable);
    if (dto.amount > available + 0.001) {
      throw new BadRequestException(
        `Insufficient service charge balance (available ₦${available.toLocaleString()})`,
      );
    }
    return this.postEntry(propertyId, {
      credit: 0,
      debit: dto.amount,
      description: dto.description,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
      workOrderId: dto.workOrderId,
    });
  }

  /** Used by maintenance spend gate — no auth (caller already authorized). */
  async getAvailableBalance(propertyId: string): Promise<number> {
    const account = await this.ensureAccount(propertyId);
    return Number(account.balanceAvailable);
  }

  /** Debit SC for a confirmed work order (idempotent by workOrderId). */
  async debitForWorkOrder(
    propertyId: string,
    workOrderId: string,
    amount: number,
    description: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    if (amount <= 0) return null;

    const existing = await db.serviceChargeLedgerEntry.findFirst({
      where: { workOrderId },
    });
    if (existing) return existing;

    const account = await this.ensureAccount(propertyId, db);
    const available = Number(account.balanceAvailable);
    if (amount > available + 0.001) {
      throw new BadRequestException(
        `Cannot post WO spend: SC balance ₦${available.toLocaleString()} is below ₦${amount.toLocaleString()}`,
      );
    }

    const entry = await db.serviceChargeLedgerEntry.create({
      data: {
        accountId: account.id,
        entryDate: new Date(),
        description,
        debit: amount,
        credit: 0,
        workOrderId,
      },
    });
    await db.serviceChargeAccount.update({
      where: { id: account.id },
      data: { balanceAvailable: { decrement: amount } },
    });
    return entry;
  }

  private async postEntry(
    propertyId: string,
    data: {
      credit: number;
      debit: number;
      description: string;
      entryDate: Date;
      workOrderId?: string;
    },
  ) {
    const account = await this.ensureAccount(propertyId);
    const delta = data.credit - data.debit;

    const [entry, updated] = await this.prisma.$transaction([
      this.prisma.serviceChargeLedgerEntry.create({
        data: {
          accountId: account.id,
          entryDate: data.entryDate,
          description: data.description,
          debit: data.debit,
          credit: data.credit,
          workOrderId: data.workOrderId,
        },
      }),
      this.prisma.serviceChargeAccount.update({
        where: { id: account.id },
        data: { balanceAvailable: { increment: delta } },
      }),
    ]);

    return {
      entry: {
        ...entry,
        debit: Number(entry.debit),
        credit: Number(entry.credit),
      },
      account: {
        ...updated,
        balanceAvailable: Number(updated.balanceAvailable),
        balanceReserved: Number(updated.balanceReserved),
      },
    };
  }

  private async ensureAccount(
    propertyId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const property = await db.propertyAsset.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const existing = await db.serviceChargeAccount.findUnique({ where: { propertyId } });
    if (existing) return existing;

    return db.serviceChargeAccount.create({
      data: { propertyId },
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
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only PM, Finance, or Admin can post service charges');
    }
  }
}
