import { Controller, Get, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DRIVER')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get('me/profile')
  getProfile(@CurrentUser() user: any) {
    return this.driversService.getMyProfile(user.id);
  }

  @Get('me/jobs')
  getJobs(@CurrentUser() user: any) {
    return this.driversService.getMyJobs(user.id);
  }

  @Get('me/stats')
  getStats(@CurrentUser() user: any) {
    return this.driversService.getMyStats(user.id);
  }

  @Get('me/payouts')
  getPayouts(@CurrentUser() user: any) {
    return this.driversService.getMyPayouts(user.id);
  }

  @Get('me/feed')
  getFeed() {
    return this.driversService.getAvailableFeed();
  }
}
