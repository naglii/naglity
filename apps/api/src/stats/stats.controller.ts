import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('admin')
  @Roles('ADMIN')
  getAdminStats() {
    return this.statsService.getAdminStats();
  }
}
