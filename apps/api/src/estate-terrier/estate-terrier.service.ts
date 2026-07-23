import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateTerrierRowDto,
  UpdateTerrierRowDto,
  VacateTerrierRowDto,
} from './dto/estate-terrier.dto';
import { calcNetRentalIncome } from '../tenant-applications/tenant-applications.utils';

const rowInclude = {
  tenantProfile: {
    select: { id: true, surname: true, otherNames: true, phone: true },
  },
};

@Injectable()
export class EstateTerrierService {
  constructor(private readonly prisma: PrismaService) {}

  findEstates(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.rentalEstate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findEstateRegister(estateId: string, user: AuthUser) {
    this.assertCanView(user);
    const estate = await this.prisma.rentalEstate.findUnique({
      where: { id: estateId },
    });
    if (!estate) throw new NotFoundException('Estate not found');

    const rows = await this.prisma.estateTerrierRow.findMany({
      where: { estateId },
      include: rowInclude,
      orderBy: { serialNo: 'asc' },
    });

    const now = new Date();
    const alertCutoff = new Date(now);
    alertCutoff.setDate(alertCutoff.getDate() + 60);

    const occupied = rows.filter((r) => r.tenantName);
    const totalRent = rows.reduce((s, r) => s + Number(r.rentAmountNgn ?? 0), 0);
    const totalExpenses = rows.reduce((s, r) => s + Number(r.expenseAmount), 0);
    const totalNet = rows.reduce((s, r) => s + Number(r.netRentalIncome), 0);
    const upcomingTerminations = rows.filter(
      (r) => r.tenancyEnd && r.tenancyEnd <= alertCutoff && r.tenancyEnd >= now,
    );

    return {
      estate,
      rows: rows.map((r) => ({
        ...r,
        rentAmountNgn: r.rentAmountNgn != null ? Number(r.rentAmountNgn) : null,
        cautionDeposit: r.cautionDeposit != null ? Number(r.cautionDeposit) : null,
        serviceCharge: r.serviceCharge != null ? Number(r.serviceCharge) : null,
        expenseAmount: Number(r.expenseAmount),
        netRentalIncome: Number(r.netRentalIncome),
      })),
      summary: {
        totalUnits: rows.length,
        occupiedUnits: occupied.length,
        vacantUnits: rows.length - occupied.length,
        occupancyRate: rows.length ? Math.round((occupied.length / rows.length) * 100) : 0,
        totalRent,
        totalExpenses,
        totalNetIncome: totalNet,
        upcomingTerminations: upcomingTerminations.map((r) => ({
          id: r.id,
          serialNo: r.serialNo,
          tenantName: r.tenantName,
          tenancyEnd: r.tenancyEnd,
        })),
      },
    };
  }

  async createRow(dto: CreateTerrierRowDto, user: AuthUser) {
    this.assertCanManage(user);
    const estate = await this.prisma.rentalEstate.findUnique({ where: { id: dto.estateId } });
    if (!estate) throw new NotFoundException('Estate not found');

    const max = await this.prisma.estateTerrierRow.aggregate({
      where: { estateId: dto.estateId },
      _max: { serialNo: true },
    });
    const serialNo = (max._max.serialNo ?? 0) + 1;

    return this.prisma.estateTerrierRow.create({
      data: {
        estateId: dto.estateId,
        serialNo,
        propertyType: dto.propertyType,
        location: dto.location,
        netRentalIncome: 0,
      },
      include: rowInclude,
    });
  }

  async updateRow(id: string, dto: UpdateTerrierRowDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.prisma.estateTerrierRow.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Terrier row not found');

    const rentAmount = dto.rentAmountNgn ?? Number(existing.rentAmountNgn ?? 0);
    const expenseAmount = dto.expenseAmount ?? Number(existing.expenseAmount);
    const netRentalIncome = calcNetRentalIncome(rentAmount, expenseAmount);

    return this.prisma.estateTerrierRow.update({
      where: { id },
      data: {
        propertyType: dto.propertyType,
        location: dto.location,
        tenantName: dto.tenantName,
        tenantPhone: dto.tenantPhone,
        rentPaidFixed: dto.rentPaidFixed,
        rentAmountNgn: dto.rentAmountNgn,
        paymentMode: dto.paymentMode,
        datePaid: dto.datePaid ? new Date(dto.datePaid) : undefined,
        tenancyStart: dto.tenancyStart ? new Date(dto.tenancyStart) : undefined,
        tenancyEnd: dto.tenancyEnd ? new Date(dto.tenancyEnd) : undefined,
        cautionDeposit: dto.cautionDeposit,
        serviceCharge: dto.serviceCharge,
        expenseDescription: dto.expenseDescription,
        expenseAmount: dto.expenseAmount,
        netRentalIncome,
      },
      include: rowInclude,
    });
  }

  async vacateRow(id: string, _dto: VacateTerrierRowDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.prisma.estateTerrierRow.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Terrier row not found');

    return this.prisma.estateTerrierRow.update({
      where: { id },
      data: {
        tenantProfileId: null,
        tenantName: null,
        tenantPhone: null,
        rentPaidFixed: null,
        rentAmountNgn: null,
        paymentMode: null,
        datePaid: null,
        tenancyStart: null,
        tenancyEnd: null,
        cautionDeposit: null,
        serviceCharge: null,
        expenseDescription: null,
        expenseAmount: 0,
        netRentalIncome: 0,
      },
      include: rowInclude,
    });
  }

  listVacantRows(estateId: string, user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.estateTerrierRow.findMany({
      where: { estateId, tenantName: null },
      orderBy: { serialNo: 'asc' },
      select: {
        id: true,
        serialNo: true,
        propertyType: true,
        location: true,
      },
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
      throw new ForbiddenException('Only PM or Finance can manage Terrier rows');
    }
  }
}
