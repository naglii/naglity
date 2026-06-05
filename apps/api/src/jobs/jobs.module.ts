import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { GatewayModule } from '../gateway/gateway.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [GatewayModule, NotificationsModule, PaymentsModule],
  providers: [JobsService],
  controllers: [JobsController],
})
export class JobsModule {}
