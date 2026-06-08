import { Controller, Get, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

/** Driver directory, visible to posters (clients). No phone numbers exposed. */
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class DirectoryController {
  constructor(private drivers: DriversService) {}

  @Get('directory')
  directory() {
    return this.drivers.getDirectory();
  }
}
