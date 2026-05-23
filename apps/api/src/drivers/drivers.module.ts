import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service.js';
import { DriversController } from './drivers.controller.js';

@Module({
  providers: [DriversService],
  controllers: [DriversController],
  exports: [DriversService],
})
export class DriversModule {}
