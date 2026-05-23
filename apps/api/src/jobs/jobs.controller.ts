import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateJobDto } from './dto/create-job.dto.js';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('BUSINESS')
  createJob(@CurrentUser() user: any, @Body() dto: CreateJobDto) {
    return this.jobsService.createJob(user.id, dto);
  }

  @Get(':id')
  getJob(@Param('id') id: string) {
    return this.jobsService.getJob(id);
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  acceptJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.acceptJob(id, user.id);
  }

  @Post(':id/start')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  startJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.startJob(id, user.id);
  }

  @Post(':id/complete')
  @UseGuards(RolesGuard)
  @Roles('BUSINESS')
  completeJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.completeJob(id, user.id);
  }
}
