import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CreateDriverDto } from './dto/create-driver.dto.js';
import { CreateBusinessDto } from './dto/create-business.dto.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';
import { UpdateBusinessDto } from './dto/update-business.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Drivers ──────────────────────────────────────────────────────────────

  @Get('drivers')
  listDrivers() { return this.adminService.listDrivers(); }

  @Post('drivers')
  createDriver(@Body() dto: CreateDriverDto) { return this.adminService.createDriver(dto); }

  @Get('drivers/:id')
  getDriver(@Param('id') id: string) { return this.adminService.getDriver(id); }

  @Patch('drivers/:id')
  updateDriver(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.adminService.updateDriver(id, dto);
  }

  @Delete('drivers/:id')
  deleteDriver(@Param('id') id: string) { return this.adminService.deleteDriver(id); }

  // ── Businesses ───────────────────────────────────────────────────────────

  @Get('businesses')
  listBusinesses() { return this.adminService.listBusinesses(); }

  @Post('businesses')
  createBusiness(@Body() dto: CreateBusinessDto) { return this.adminService.createBusiness(dto); }

  @Get('businesses/:id')
  getBusiness(@Param('id') id: string) { return this.adminService.getBusiness(id); }

  @Patch('businesses/:id')
  updateBusiness(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.adminService.updateBusiness(id, dto);
  }

  @Delete('businesses/:id')
  deleteBusiness(@Param('id') id: string) { return this.adminService.deleteBusiness(id); }

  // ── Jobs ─────────────────────────────────────────────────────────────────

  @Get('jobs')
  listJobs(@Query('status') status?: string) { return this.adminService.listAllJobs(status); }

  @Patch('jobs/:id/paid')
  markPaid(@Param('id') id: string) { return this.adminService.markJobPaid(id); }
}
