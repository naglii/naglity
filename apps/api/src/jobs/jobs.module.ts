import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
  imports: [GatewayModule],
  providers: [JobsService],
  controllers: [JobsController],
})
export class JobsModule {}
