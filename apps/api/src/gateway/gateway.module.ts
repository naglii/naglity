import { Module } from '@nestjs/common';
import { JobsGateway } from './jobs.gateway.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  providers: [JobsGateway],
  exports: [JobsGateway],
})
export class GatewayModule {}
