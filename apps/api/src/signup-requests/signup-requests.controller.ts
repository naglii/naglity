import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { SignupRequestsService } from './signup-requests.service.js';
import { CreateSignupRequestDto } from './dto/create-signup-request.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller()
export class SignupRequestsController {
  constructor(private service: SignupRequestsService) {}

  // ── Public: anyone can submit a request to join ──
  @Post('signup-requests')
  @HttpCode(201)
  create(@Body() dto: CreateSignupRequestDto) {
    return this.service.create(dto);
  }

  // ── Admin only ──
  @Get('admin/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  list() {
    return this.service.list();
  }

  @Patch('admin/requests/:id/handled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  setHandled(@Param('id') id: string, @Body() body: { handled: boolean }) {
    return this.service.setHandled(id, !!body.handled);
  }

  @Delete('admin/requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
