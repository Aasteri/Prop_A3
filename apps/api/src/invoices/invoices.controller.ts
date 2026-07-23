import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceDto,
  RejectPaymentDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get('settlement-entities')
  settlementEntities() {
    return this.invoices.listSettlementEntities();
  }

  @Get('approved-changes')
  approvedChanges(@Query('projectId') projectId?: string) {
    return this.invoices.listApprovedChanges(projectId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.invoices.findAll(user);
  }

  @Get('payments/:paymentId/receipt')
  async receipt(@Param('paymentId') paymentId: string, @Res() res: Response) {
    const file = await this.invoices.getReceiptPdf(paymentId);
    const stream = file.getStream();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${paymentId}.pdf"`,
    });
    stream.pipe(res);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoices.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.invoices.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoices.update(id, dto, user);
  }

  @Post(':id/send')
  send(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.invoices.send(id, user);
  }

  @Post(':id/variations/from-change-log/:changeLogId')
  addVariationFromChangeLog(
    @Param('id') id: string,
    @Param('changeLogId') changeLogId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoices.addVariationFromChangeLog(id, changeLogId, user);
  }

  @Post(':id/payments')
  @UseInterceptors(FileInterceptor('proof', { storage: memoryStorage() }))
  uploadPayment(
    @Param('id') id: string,
    @Body('amount') amount: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoices.uploadPayment(id, parseFloat(amount), file, user);
  }

  @Post('payments/:paymentId/verify')
  verifyPayment(@Param('paymentId') paymentId: string, @CurrentUser() user: AuthUser) {
    return this.invoices.verifyPayment(paymentId, user);
  }

  @Post('payments/:paymentId/reject')
  rejectPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: RejectPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoices.rejectPayment(paymentId, dto, user);
  }
}
