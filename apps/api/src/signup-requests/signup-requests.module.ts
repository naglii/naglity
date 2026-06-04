import { Module } from '@nestjs/common';
import { SignupRequestsService } from './signup-requests.service.js';
import { SignupRequestsController } from './signup-requests.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  providers: [SignupRequestsService],
  controllers: [SignupRequestsController],
})
export class SignupRequestsModule {}
