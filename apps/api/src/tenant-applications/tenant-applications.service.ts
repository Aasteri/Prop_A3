import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  InvoiceType,
  TenantApplicationStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateTenantApplicationDto,
  RejectTenantApplicationDto,
  SubmitTenantApplicationDto,
  UpdateTenantApplicationDto,
} from './dto/tenant-application.dto';
import {
  calcAgencyFee,
  generateApplicationRef,
} from './tenant-applications.utils';
import { generateInvoiceNumber } from '../invoices/invoices.utils';

const include = {
  estate: true,
  terrierRow: { select: { id: true, serialNo: true, propertyType: true, location: true } },
  agencyFeeInvoice: { select: { id: true, invoiceNumber: true, status: true, outstanding: true } },
  tenantProfile: true,
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};

@Injectable()
export class TenantApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, estateId?: string) {
    this.assertCanView(user);
    return this.prisma.tenantApplication.findMany({
      where: estateId ? { estateId } : {},
      include,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const app = await this.prisma.tenantApplication.findUnique({ where: { id }, include });
    if (!app) throw new NotFoundException('Tenant application not found');
    return app;
  }

  async create(dto: CreateTenantApplicationDto, user: AuthUser) {
    this.assertCanCreate(user);
    await this.validateEstateAndRow(dto.estateId, dto.terrierRowId);

    return this.prisma.$transaction(async (tx) => {
      const estate = await tx.rentalEstate.findUniqueOrThrow({ where: { id: dto.estateId } });
      const applicationRef = await generateApplicationRef(tx, estate.code);
      const agencyFeeAmount = calcAgencyFee(dto.rentAccepted);

      return tx.tenantApplication.create({
        data: {
          applicationRef,
          estateId: dto.estateId,
          terrierRowId: dto.terrierRowId,
          surname: dto.surname,
          otherNames: dto.otherNames,
          nationality: dto.nationality,
          stateOfOrigin: dto.stateOfOrigin,
          maritalStatus: dto.maritalStatus,
          phone: dto.phone,
          formerAddress: dto.formerAddress,
          vacateReason: dto.vacateReason,
          permanentAddress: dto.permanentAddress,
          occupation: dto.occupation,
          officeAddress: dto.officeAddress,
          propertyTypeAccepted: dto.propertyTypeAccepted,
          rentAccepted: dto.rentAccepted,
          rentPayer: dto.rentPayer,
          nextOfKinName: dto.nextOfKinName,
          nextOfKinPhone: dto.nextOfKinPhone,
          nextOfKinAddress: dto.nextOfKinAddress,
          nextOfKinRelationship: dto.nextOfKinRelationship,
          guarantorName: dto.guarantorName,
          guarantorWorkAddress: dto.guarantorWorkAddress,
          guarantorPhone: dto.guarantorPhone,
          guarantorSignature: dto.guarantorSignature,
          inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : null,
          applicantSignature: dto.applicantSignature,
          clause1Accepted: dto.clause1Accepted,
          clause2Accepted: dto.clause2Accepted,
          agencyFeeAmount,
          createdById: user.id,
        },
        include,
      });
    });
  }

  async update(id: string, dto: UpdateTenantApplicationDto, user: AuthUser) {
    this.assertCanCreate(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== TenantApplicationStatus.DRAFT) {
      throw new BadRequestException('Only draft applications can be edited');
    }
    await this.validateEstateAndRow(dto.estateId, dto.terrierRowId);

    return this.prisma.tenantApplication.update({
      where: { id },
      data: {
        estateId: dto.estateId,
        terrierRowId: dto.terrierRowId,
        surname: dto.surname,
        otherNames: dto.otherNames,
        nationality: dto.nationality,
        stateOfOrigin: dto.stateOfOrigin,
        maritalStatus: dto.maritalStatus,
        phone: dto.phone,
        formerAddress: dto.formerAddress,
        vacateReason: dto.vacateReason,
        permanentAddress: dto.permanentAddress,
        occupation: dto.occupation,
        officeAddress: dto.officeAddress,
        propertyTypeAccepted: dto.propertyTypeAccepted,
        rentAccepted: dto.rentAccepted,
        rentPayer: dto.rentPayer,
        nextOfKinName: dto.nextOfKinName,
        nextOfKinPhone: dto.nextOfKinPhone,
        nextOfKinAddress: dto.nextOfKinAddress,
        nextOfKinRelationship: dto.nextOfKinRelationship,
        guarantorName: dto.guarantorName,
        guarantorWorkAddress: dto.guarantorWorkAddress,
        guarantorPhone: dto.guarantorPhone,
        guarantorSignature: dto.guarantorSignature,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : null,
        applicantSignature: dto.applicantSignature,
        clause1Accepted: dto.clause1Accepted,
        clause2Accepted: dto.clause2Accepted,
        agencyFeeAmount: calcAgencyFee(dto.rentAccepted),
      },
      include,
    });
  }

  async submit(id: string, dto: SubmitTenantApplicationDto, user: AuthUser) {
    this.assertCanCreate(user);
    const app = await this.findOne(id, user);
    if (app.status !== TenantApplicationStatus.DRAFT) {
      throw new BadRequestException('Only draft applications can be submitted');
    }
    if (!app.clause1Accepted || !app.clause2Accepted) {
      throw new BadRequestException('Both legal clauses must be accepted');
    }

    const applicantSignature = dto.applicantSignature ?? app.applicantSignature;
    const guarantorSignature = dto.guarantorSignature ?? app.guarantorSignature;
    if (!applicantSignature?.trim()) {
      throw new BadRequestException('Applicant signature is required');
    }
    if (!guarantorSignature?.trim()) {
      throw new BadRequestException('Guarantor signature is required');
    }

    const settlement = await this.prisma.settlementEntity.findFirst({
      where: { isDefault: true },
    });
    if (!settlement) {
      throw new BadRequestException('No default settlement entity configured');
    }

    const agencyFee = Number(app.agencyFeeAmount);
    const clientName = `${app.surname} ${app.otherNames}`.trim();
    const issueDate = new Date();
    const year = issueDate.getFullYear();

    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await generateInvoiceNumber(tx, InvoiceType.AGENCY, year);

      const invoice = await tx.invoice.create({
        data: {
          settlementEntityId: settlement.id,
          invoiceNumber,
          invoiceType: InvoiceType.AGENCY,
          status: InvoiceStatus.SENT,
          issueDate,
          clientName,
          clientAddress: app.permanentAddress,
          projectDetails: `Tenant application ${app.applicationRef} — ${app.estate.name}`,
          paymentTerms: 'Due upon submission of tenant application',
          baseTotal: agencyFee,
          variationTotal: 0,
          revisedTotal: agencyFee,
          paidTotal: 0,
          outstanding: agencyFee,
          createdById: user.id,
          sentAt: new Date(),
          lines: {
            create: [
              {
                description: 'Agency & Legal fee (20% of rental value)',
                quantity: 1,
                unit: 'Lot',
                unitPrice: agencyFee,
                totalAmount: agencyFee,
                sortOrder: 0,
              },
            ],
          },
        },
      });

      return tx.tenantApplication.update({
        where: { id },
        data: {
          status: TenantApplicationStatus.PENDING_REVIEW,
          submittedAt: new Date(),
          applicantSignature,
          guarantorSignature,
          agencyFeeInvoiceId: invoice.id,
        },
        include,
      });
    });
  }

  async approve(id: string, user: AuthUser) {
    this.assertCanReview(user);
    const app = await this.findOne(id, user);
    if (app.status !== TenantApplicationStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only pending applications can be approved');
    }
    if (!app.terrierRowId) {
      throw new BadRequestException('Assign a unit (Terrier row) before approval');
    }

    const tenantName = `${app.surname} ${app.otherNames}`.trim();
    const rentAmount = Number(app.rentAccepted);

    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.tenantProfile.create({
        data: {
          surname: app.surname,
          otherNames: app.otherNames,
          phone: app.phone,
          nationality: app.nationality,
          stateOfOrigin: app.stateOfOrigin,
          permanentAddress: app.permanentAddress,
          occupation: app.occupation,
        },
      });

      await tx.estateTerrierRow.update({
        where: { id: app.terrierRowId! },
        data: {
          tenantProfileId: profile.id,
          tenantName,
          tenantPhone: app.phone,
          rentAmountNgn: rentAmount,
        },
      });

      return tx.tenantApplication.update({
        where: { id },
        data: {
          status: TenantApplicationStatus.APPROVED,
          approvedAt: new Date(),
          reviewedById: user.id,
          tenantProfileId: profile.id,
        },
        include,
      });
    });
  }

  async reject(id: string, dto: RejectTenantApplicationDto, user: AuthUser) {
    this.assertCanReview(user);
    const app = await this.findOne(id, user);
    if (app.status !== TenantApplicationStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only pending applications can be rejected');
    }

    return this.prisma.tenantApplication.update({
      where: { id },
      data: {
        status: TenantApplicationStatus.REJECTED,
        rejectReason: dto.rejectReason,
        reviewedById: user.id,
      },
      include,
    });
  }

  private async validateEstateAndRow(estateId: string, terrierRowId?: string) {
    const estate = await this.prisma.rentalEstate.findUnique({ where: { id: estateId } });
    if (!estate) throw new NotFoundException('Estate not found');

    if (terrierRowId) {
      const row = await this.prisma.estateTerrierRow.findUnique({ where: { id: terrierRowId } });
      if (!row || row.estateId !== estateId) {
        throw new BadRequestException('Terrier row must belong to the selected estate');
      }
    }
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.SALES,
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException();
    }
  }

  private assertCanCreate(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.SALES,
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only sales or PM can manage tenant applications');
    }
  }

  private assertCanReview(user: AuthUser) {
    const allowed: UserRole[] = [UserRole.PROJECT_MANAGER, UserRole.CEO, UserRole.ADMIN];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only PM can review tenant applications');
    }
  }
}
