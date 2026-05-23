import { Controller, Get, UseGuards } from '@nestjs/common';
import { BusinessesService } from './businesses.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Get('me/profile')
  getProfile(@CurrentUser() user: any) {
    return this.businessesService.getMyProfile(user.id);
  }

  @Get('me/jobs')
  getJobs(@CurrentUser() user: any) {
    return this.businessesService.getMyJobs(user.id);
  }

  @Get('me/stats')
  getStats(@CurrentUser() user: any) {
    return this.businessesService.getMyStats(user.id);
  }
}
