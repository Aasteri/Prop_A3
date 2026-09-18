import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  AssignArtisansDto,
  CreateMarketplaceJobDto,
  InitiateEscrowDto,
  PostChatMessageDto,
  PublicSeekerRegisterDto,
  SelectQuoteDto,
  SubmitQuoteDto,
} from './dto/marketplace.dto';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get('catalog')
  listCatalog(@Query('q') q?: string) {
    return this.marketplace.listCatalog(q);
  }

  @Get('payment-methods')
  paymentMethods() {
    return this.marketplace.paymentMethods();
  }

  @Post('seekers/register')
  registerSeeker(@Body() dto: PublicSeekerRegisterDto) {
    return this.marketplace.registerSeeker(dto);
  }

  @Post('jobs')
  @UseGuards(JwtAuthGuard)
  createJob(@Body() dto: CreateMarketplaceJobDto, @CurrentUser() user: AuthUser) {
    return this.marketplace.createJob(dto, user);
  }

  @Get('jobs')
  @UseGuards(JwtAuthGuard)
  myJobs(@CurrentUser() user: AuthUser) {
    return this.marketplace.myJobs(user);
  }

  @Get('jobs/:id')
  @UseGuards(JwtAuthGuard)
  getJob(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.marketplace.getJob(id, user);
  }

  @Post('jobs/:id/assign')
  @UseGuards(JwtAuthGuard)
  assign(
    @Param('id') id: string,
    @Body() dto: AssignArtisansDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.marketplace.assignArtisans(id, dto, user);
  }

  @Post('jobs/:id/quotes')
  @UseGuards(JwtAuthGuard)
  quote(@Param('id') id: string, @Body() dto: SubmitQuoteDto, @CurrentUser() user: AuthUser) {
    return this.marketplace.submitQuote(id, dto, user);
  }

  @Post('jobs/:id/select-quote')
  @UseGuards(JwtAuthGuard)
  selectQuote(
    @Param('id') id: string,
    @Body() dto: SelectQuoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.marketplace.selectQuote(id, dto, user);
  }

  @Get('jobs/:id/messages')
  @UseGuards(JwtAuthGuard)
  messages(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.marketplace.listMessages(id, user);
  }

  @Post('jobs/:id/messages')
  @UseGuards(JwtAuthGuard)
  postMessage(
    @Param('id') id: string,
    @Body() dto: PostChatMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.marketplace.postMessage(id, dto, user);
  }

  @Post('jobs/:id/escrow')
  @UseGuards(JwtAuthGuard)
  escrow(@Param('id') id: string, @Body() dto: InitiateEscrowDto, @CurrentUser() user: AuthUser) {
    return this.marketplace.initiateEscrow(id, dto, user);
  }

  @Post('jobs/:id/escrow/proof')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('proof', { storage: memoryStorage() }))
  uploadProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('amount') amount: string | undefined,
    @Body('isDeposit') isDeposit: string | undefined,
    @Body('paymentId') paymentId: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.marketplace.uploadEscrowProof(id, file, user, {
      amount: amount ? parseFloat(amount) : undefined,
      isDeposit: isDeposit === 'true' || isDeposit === '1',
      paymentId,
    });
  }

  @Patch('payments/:paymentId/verify')
  @UseGuards(JwtAuthGuard)
  verifyPayment(@Param('paymentId') paymentId: string, @CurrentUser() user: AuthUser) {
    return this.marketplace.verifyEscrowPayment(paymentId, user);
  }

  @Post('jobs/:id/confirm-complete')
  @UseGuards(JwtAuthGuard)
  confirmComplete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.marketplace.confirmComplete(id, user);
  }
}
