import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import {
  ChangeLogStatus,
  InvoiceStatus,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateInvoiceDto, RejectPaymentDto, UpdateInvoiceDto } from './dto/invoice.dto';
import {
  calcLineTotal,
  generateInvoiceNumber,
  generateReceiptNumber,
  nextVariationCode,
  recalcInvoiceTotals,
} from './invoices.utils';
import { buildReceiptPdf } from './receipt.pdf';

const include = {
  project: { include: { site: true } },
  settlementEntity: true,
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  lines: { orderBy: { sortOrder: 'asc' as const } },
  variations: {
    orderBy: { sortOrder: 'asc' as const },
    include: { changeLog: { select: { id: true, changeId: true, status: true } } },
  },
  payments: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  },
};

@Injectable()
export class InvoicesService {
  private readonly uploadsDir = path.join(process.cwd(), '..', '..', 'uploads', 'payments');

  constructor(private readonly prisma: PrismaService) {
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  listSettlementEntities() {
    return this.prisma.settlementEntity.findMany({ orderBy: { name: 'asc' } });
  }

  findAll(user: AuthUser) {
    return this.prisma.invoice.findMany({
      include,
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(dto: CreateInvoiceDto, user: AuthUser) {
    this.assertCanManageInvoices(user);

    if (!dto.lines?.length) {
      throw new BadRequestException('At least one line item is required');
    }

    const settlement = await this.prisma.settlementEntity.findUnique({
      where: { id: dto.settlementEntityId },
    });
    if (!settlement) throw new NotFoundException('Settlement entity not found');

    const issueDate = new Date(dto.issueDate);
    const year = issueDate.getFullYear();

    const baseTotal = dto.lines.reduce(
      (sum, l) => sum + calcLineTotal(l.quantity, l.unitPrice),
      0,
    );
    const variationTotal = (dto.variations ?? []).reduce((sum, v) => sum + v.amount, 0);
    const { revisedTotal, outstanding } = recalcInvoiceTotals(baseTotal, variationTotal, 0);

    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await generateInvoiceNumber(tx, dto.invoiceType, year);

      const invoice = await tx.invoice.create({
        data: {
          projectId: dto.projectId,
          settlementEntityId: dto.settlementEntityId,
          invoiceNumber,
          invoiceType: dto.invoiceType,
          issueDate,
          contractRef: dto.contractRef,
          clientName: dto.clientName,
          clientAddress: dto.clientAddress,
          projectDetails: dto.projectDetails,
          paymentTerms: dto.paymentTerms,
          baseTotal,
          variationTotal,
          revisedTotal,
          paidTotal: 0,
          outstanding,
          createdById: user.id,
          lines: {
            create: dto.lines.map((line, i) => ({
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unitPrice: line.unitPrice,
              totalAmount: calcLineTotal(line.quantity, line.unitPrice),
              sortOrder: i,
            })),
          },
        },
      });

      for (let i = 0; i < (dto.variations ?? []).length; i++) {
        const v = dto.variations![i];
        if (v.changeLogId) {
          const change = await tx.projectChangeLog.findUnique({
            where: { id: v.changeLogId },
          });
          if (!change || change.status !== ChangeLogStatus.APPROVED) {
            throw new BadRequestException(
              `Change log ${v.changeLogId} must be approved before linking`,
            );
          }
        }
        const code = await nextVariationCode(tx, invoice.id);
        await tx.invoiceVariation.create({
          data: {
            invoiceId: invoice.id,
            changeLogId: v.changeLogId,
            variationCode: code,
            title: v.title,
            description: v.description,
            amount: v.amount,
            sortOrder: i,
          },
        });
      }

      return tx.invoice.findUnique({ where: { id: invoice.id }, include });
    });
  }

  async update(id: string, dto: UpdateInvoiceDto, user: AuthUser) {
    this.assertCanManageInvoices(user);

    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice not found');
    if (existing.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be edited');
    }

    const paidTotal = Number(existing.paidTotal);
    const baseTotal = dto.lines.reduce(
      (sum, l) => sum + calcLineTotal(l.quantity, l.unitPrice),
      0,
    );
    const variationTotal = (dto.variations ?? []).reduce((sum, v) => sum + v.amount, 0);
    const { revisedTotal, outstanding } = recalcInvoiceTotals(
      baseTotal,
      variationTotal,
      paidTotal,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceVariation.deleteMany({ where: { invoiceId: id } });

      await tx.invoice.update({
        where: { id },
        data: {
          projectId: dto.projectId,
          settlementEntityId: dto.settlementEntityId,
          invoiceType: dto.invoiceType,
          issueDate: new Date(dto.issueDate),
          contractRef: dto.contractRef,
          clientName: dto.clientName,
          clientAddress: dto.clientAddress,
          projectDetails: dto.projectDetails,
          paymentTerms: dto.paymentTerms,
          baseTotal,
          variationTotal,
          revisedTotal,
          outstanding,
          lines: {
            create: dto.lines.map((line, i) => ({
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unitPrice: line.unitPrice,
              totalAmount: calcLineTotal(line.quantity, line.unitPrice),
              sortOrder: i,
            })),
          },
        },
      });

      for (let i = 0; i < (dto.variations ?? []).length; i++) {
        const v = dto.variations![i];
        if (v.changeLogId) {
          const change = await tx.projectChangeLog.findUnique({
            where: { id: v.changeLogId },
          });
          if (!change || change.status !== ChangeLogStatus.APPROVED) {
            throw new BadRequestException(
              `Change log ${v.changeLogId} must be approved before linking`,
            );
          }
        }
        const code = await nextVariationCode(tx, id);
        await tx.invoiceVariation.create({
          data: {
            invoiceId: id,
            changeLogId: v.changeLogId,
            variationCode: code,
            title: v.title,
            description: v.description,
            amount: v.amount,
            sortOrder: i,
          },
        });
      }

      return tx.invoice.findUnique({ where: { id }, include });
    });
  }

  async send(id: string, user: AuthUser) {
    this.assertCanManageInvoices(user);
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.SENT, sentAt: new Date() },
      include,
    });
  }

  async addVariationFromChangeLog(invoiceId: string, changeLogId: string, user: AuthUser) {
    this.assertCanManageInvoices(user);

    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.SENT) {
      throw new BadRequestException('Cannot add variations to a closed invoice');
    }

    const change = await this.prisma.projectChangeLog.findUnique({
      where: { id: changeLogId },
    });
    if (!change || change.status !== ChangeLogStatus.APPROVED) {
      throw new BadRequestException('Change log must be approved');
    }

    const existingLink = await this.prisma.invoiceVariation.findFirst({
      where: { changeLogId },
    });
    if (existingLink) {
      throw new BadRequestException('Change log already linked to an invoice variation');
    }

    return this.prisma.$transaction(async (tx) => {
      const code = await nextVariationCode(tx, invoiceId);
      const amount = 0;

      await tx.invoiceVariation.create({
        data: {
          invoiceId,
          changeLogId,
          variationCode: code,
          title: `Change ${change.changeId}`,
          description: change.description,
          amount,
          sortOrder: 99,
        },
      });

      const variations = await tx.invoiceVariation.findMany({ where: { invoiceId } });
      const variationTotal = variations.reduce((s, v) => s + Number(v.amount), 0);
      const { revisedTotal, outstanding } = recalcInvoiceTotals(
        Number(invoice.baseTotal),
        variationTotal,
        Number(invoice.paidTotal),
      );

      return tx.invoice.update({
        where: { id: invoiceId },
        data: { variationTotal, revisedTotal, outstanding },
        include,
      });
    });
  }

  async uploadPayment(
    invoiceId: string,
    amount: number,
    file: Express.Multer.File | undefined,
    user: AuthUser,
  ) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (
      invoice.status === InvoiceStatus.DRAFT ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException('Invoice must be sent before accepting payment');
    }

    let proofUrl: string | undefined;
    let proofFilename: string | undefined;

    if (file) {
      proofFilename = `${Date.now()}-${file.originalname}`;
      const dest = path.join(this.uploadsDir, proofFilename);
      fs.writeFileSync(dest, file.buffer);
      proofUrl = `/uploads/payments/${proofFilename}`;
    }

    return this.prisma.payment.create({
      data: {
        invoiceId,
        amount,
        status: PaymentStatus.PENDING,
        proofUrl,
        proofFilename,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async verifyPayment(paymentId: string, user: AuthUser) {
    this.assertCanVerifyPayments(user);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: { include: { settlementEntity: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already processed');
    }

    const year = new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      const receiptNumber = await generateReceiptNumber(tx, year);

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.VERIFIED,
          receiptNumber,
          verifiedById: user.id,
          verifiedAt: new Date(),
        },
      });

      const invoice = payment.invoice;
      const verifiedPayments = await tx.payment.findMany({
        where: { invoiceId: invoice.id, status: PaymentStatus.VERIFIED },
      });
      const paidTotal = verifiedPayments.reduce((s, p) => s + Number(p.amount), 0);
      const { revisedTotal, outstanding } = recalcInvoiceTotals(
        Number(invoice.baseTotal),
        Number(invoice.variationTotal),
        paidTotal,
      );

      let status: InvoiceStatus = InvoiceStatus.SENT;
      if (paidTotal > 0 && outstanding > 0) status = InvoiceStatus.PARTIALLY_PAID;
      if (outstanding <= 0) status = InvoiceStatus.PAID;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidTotal, outstanding, status },
      });

      return tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          invoice: { include },
          verifiedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });
  }

  async rejectPayment(paymentId: string, dto: RejectPaymentDto, user: AuthUser) {
    this.assertCanVerifyPayments(user);

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already processed');
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REJECTED,
        rejectReason: dto.rejectReason,
        verifiedById: user.id,
        verifiedAt: new Date(),
      },
    });
  }

  async getReceiptPdf(paymentId: string): Promise<StreamableFile> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: { include: { settlementEntity: true } },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.VERIFIED || !payment.receiptNumber) {
      throw new BadRequestException('Receipt available only for verified payments');
    }

    const buffer = await buildReceiptPdf({
      receiptNumber: payment.receiptNumber,
      invoiceNumber: payment.invoice.invoiceNumber,
      clientName: payment.invoice.clientName,
      amount: Number(payment.amount),
      verifiedAt: payment.verifiedAt ?? new Date(),
      settlementEntity: payment.invoice.settlementEntity,
    });

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${payment.receiptNumber}.pdf"`,
    });
  }

  listApprovedChanges(projectId?: string) {
    return this.prisma.projectChangeLog.findMany({
      where: {
        status: ChangeLogStatus.APPROVED,
        ...(projectId ? { projectId } : {}),
        invoiceVariations: { none: {} },
      },
      select: {
        id: true,
        changeId: true,
        description: true,
        impactLevel: true,
        projectId: true,
      },
      orderBy: { changeId: 'asc' },
    });
  }

  private assertCanManageInvoices(user: AuthUser) {
    if (
      user.role !== UserRole.FINANCE &&
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Not allowed to manage invoices');
    }
  }

  private assertCanVerifyPayments(user: AuthUser) {
    if (
      user.role !== UserRole.FINANCE &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only finance can verify payments');
    }
  }
}
