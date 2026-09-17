import { Body, Controller, Headers, Logger, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MoneyInflowsService } from '../money-inflows/money-inflows.service';

/**
 * Paystack webhook stub.
 * Set PAYSTACK_SECRET_KEY when Abraham provides keys — until then the endpoint
 * accepts events only if the key is present (optional; app boots without it).
 */
@Controller('paystack')
export class PaystackController {
  private readonly logger = new Logger(PaystackController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly moneyInflows: MoneyInflowsService,
  ) {}

  @Post('webhook')
  async webhook(
    @Headers('x-paystack-signature') signature: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      this.logger.warn('Paystack webhook received but PAYSTACK_SECRET_KEY is not set — ignoring');
      return {
        ok: false,
        message:
          'PAYSTACK_SECRET_KEY not configured. Abraham will provide keys soon; webhook is a no-op until then.',
      };
    }

    // Stub: full HMAC verification lands when keys are live.
    void signature;
    const event = String(body.event ?? '');
    const data = (body.data ?? {}) as Record<string, unknown>;

    if (event === 'charge.success') {
      const amountKobo = Number(data.amount ?? 0);
      const amount = Math.round((amountKobo / 100) * 100) / 100;
      const reference = String(data.reference ?? '');
      const customer = (data.customer ?? {}) as Record<string, unknown>;
      const metadata = (data.metadata ?? {}) as Record<string, unknown>;

      const inflow = await this.moneyInflows.createPaystackInflow({
        amount,
        paystackRef: reference,
        payerName: String(customer.email ?? customer.first_name ?? 'Paystack payer'),
        payerReference: reference,
        invoiceId: metadata.invoiceId ? String(metadata.invoiceId) : undefined,
        notes: `Paystack ${event}`,
      });

      return { ok: true, inflowId: inflow.id, number: inflow.number };
    }

    this.logger.log(`Paystack event ignored: ${event || '(none)'}`);
    return { ok: true, ignored: true, event };
  }
}
