import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { BillingController } from './billing.controller.js';
import { PayoutAccountController } from './payout-account.controller.js';

@Module({
  providers: [PaymentsService],
  controllers: [BillingController, PayoutAccountController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
