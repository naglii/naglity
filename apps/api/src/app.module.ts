import 'dotenv/config';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AdminModule } from './admin/admin.module.js';
import { DriversModule } from './drivers/drivers.module.js';
import { BusinessesModule } from './businesses/businesses.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { StatsModule } from './stats/stats.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { SignupRequestsModule } from './signup-requests/signup-requests.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    DriversModule,
    BusinessesModule,
    JobsModule,
    StatsModule,
    GatewayModule,
    NotificationsModule,
    SignupRequestsModule,
  ],
})
export class AppModule {}
