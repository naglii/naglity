import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

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

  // Declared before ':id' so it isn't shadowed by the param route.
  @Get('my-offers')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  myOffers(@CurrentUser() user: any) {
    return this.jobsService.myOffers(user.id);
  }

  @Get(':id')
  getJob(@Param('id') id: string) {
    return this.jobsService.getJob(id);
  }

  @Get(':id/receipt')
  getReceipt(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.getReceipt(id, user);
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  acceptJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.acceptJob(id, user.id);
  }

  @Post(':id/offers')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  submitOffer(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateOfferDto) {
    return this.jobsService.submitOffer(id, user.id, dto);
  }

  @Get(':id/offers')
  @UseGuards(RolesGuard)
  @Roles('BUSINESS')
  listOffers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.listOffers(id, user.id);
  }

  @Post(':id/offers/:offerId/accept')
  @UseGuards(RolesGuard)
  @Roles('BUSINESS')
  acceptOffer(@Param('id') id: string, @Param('offerId') offerId: string, @CurrentUser() user: any) {
    return this.jobsService.acceptOffer(id, offerId, user.id);
  }

  @Post(':id/invite/:driverId')
  @UseGuards(RolesGuard)
  @Roles('BUSINESS')
  inviteDriver(@Param('id') id: string, @Param('driverId') driverId: string, @CurrentUser() user: any) {
    return this.jobsService.inviteDriver(id, driverId, user.id);
  }

  // Any party to a completed job (owner or assigned driver) can review.
  @Post(':id/review')
  submitReview(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.jobsService.submitReview(id, user.id, dto);
  }

  @Post(':id/start')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  startJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.startJob(id, user.id);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  cancelJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.cancelJob(id, user.id);
  }

  @Post(':id/complete')
  @UseGuards(RolesGuard)
  @Roles('BUSINESS')
  completeJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.completeJob(id, user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('BUSINESS')
  deleteJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.deleteJob(id, user.id);
  }
}
