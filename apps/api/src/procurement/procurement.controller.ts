import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreatePurchaseRequisitionDto,
  CreateSupplierDto,
  ListProcurementQueryDto,
} from './dto/procurement.dto';
import { ProcurementService } from './procurement.service';

@Controller('procurement')
@UseGuards(JwtAuthGuard)
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Get('suppliers')
  listSuppliers(@CurrentUser() user: AuthUser, @Query() query: ListProcurementQueryDto) {
    return this.procurement.listSuppliers(user, query);
  }

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto, @CurrentUser() user: AuthUser) {
    return this.procurement.createSupplier(dto, user);
  }

  @Get('requisitions')
  listRequisitions(@CurrentUser() user: AuthUser, @Query() query: ListProcurementQueryDto) {
    return this.procurement.listRequisitions(user, query);
  }

  @Post('requisitions')
  createRequisition(
    @Body() dto: CreatePurchaseRequisitionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.procurement.createRequisition(dto, user);
  }

  @Patch('requisitions/:id/approve')
  approveRequisition(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.procurement.approveRequisition(id, user);
  }
}
