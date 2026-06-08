import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service.js';
import { DriversController } from './drivers.controller.js';
import { DirectoryController } from './directory.controller.js';

@Module({
  providers: [DriversService],
  controllers: [DriversController, DirectoryController],
  exports: [DriversService],
})
export class DriversModule {}
