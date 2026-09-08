import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RemittanceStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateRemittanceDto, MarkRemittancePaidDto } from './dto/remittance.dto';

const include = {
  property: {
    select: { id: true, name: true, code: true, address: true, landlordName: true },
  },
};

@Injectable()
export class RemittancesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.landlordRemittance
      .findMany({
        include,
        orderBy: [{ periodEnd: 'desc' }, { createdAt: 'desc' }],
      })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.landlordRemittance.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Remittance not found');
    return this.serialize(row);
  }

  async create(dto: CreateRemittanceDto, user: AuthUser) {
    this.assertCanManage(user);
    const property = await this.prisma.propertyAsset.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const other = dto.otherReceipts ?? 0;
    const expenses = dto.expensesTotal ?? 0;
    const gross = dto.grossRent + other;
    const net = Math.round((gross - expenses) * 100) / 100;
    if (net < 0) {
      throw new BadRequestException('Net remittance cannot be negative');
    }

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const stamp = Date.now().toString(36).toUpperCase().slice(-4);

    const row = await this.prisma.landlordRemittance.create({
      data: {
        number: `REM-${year}${month}-${stamp}`,
        propertyId: dto.propertyId,
        landlordName: dto.landlordName || property.landlordName || 'Landlord',
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        grossRent: dto.grossRent,
        otherReceipts: other,
        expensesTotal: expenses,
        netAmount: net,
        expenseNotes: dto.expenseNotes,
        bankAccount: dto.bankAccount,
        status: RemittanceStatus.DRAFT,
      },
      include,
    });
    return this.serialize(row);
  }

  async approve(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== RemittanceStatus.DRAFT) {
      throw new BadRequestException('Only draft remittances can be approved');
    }
    const row = await this.prisma.landlordRemittance.update({
      where: { id },
      data: { status: RemittanceStatus.APPROVED },
      include,
    });
    return this.serialize(row);
  }

  async markPaid(id: string, dto: MarkRemittancePaidDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (
      existing.status !== RemittanceStatus.APPROVED &&
      existing.status !== RemittanceStatus.DRAFT
    ) {
      throw new BadRequestException('Remittance already paid or invalid status');
    }
    const row = await this.prisma.landlordRemittance.update({
      where: { id },
      data: {
        status: RemittanceStatus.PAID,
        transferRef: dto.transferRef,
        bankAccount: dto.bankAccount ?? existing.bankAccount,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      },
      include,
    });
    return this.serialize(row);
  }

  private serialize<T extends Record<string, unknown>>(row: T) {
    const r = row as T & {
      grossRent: unknown;
      otherReceipts: unknown;
      expensesTotal: unknown;
      netAmount: unknown;
    };
    return {
      ...r,
      grossRent: Number(r.grossRent),
      otherReceipts: Number(r.otherReceipts),
      expensesTotal: Number(r.expensesTotal),
      netAmount: Number(r.netAmount),
    };
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    this.assertCanView(user);
  }
}
