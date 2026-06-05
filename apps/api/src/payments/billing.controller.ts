import { Controller, Get, Post, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUSINESS')
export class BillingController {
  constructor(
    private payments: PaymentsService,
    private prisma: PrismaService,
  ) {}

  @Get('status')
  async status(@CurrentUser() user: any) {
    const business = await this.prisma.business.findUnique({ where: { userId: user.id } });
    if (!business) throw new ForbiddenException('Business profile not found');
    const heldInEscrowCents = await this.payments.getBusinessEscrowHeld(business.id);
    return {
      hasPaymentMethod: business.hasPaymentMethod,
      provider: this.payments.providerName,
      cardBrand: business.cardBrand,
      cardLast4: business.cardLast4,
      heldInEscrowCents,
    };
  }

  @Get('transactions')
  async transactions(@CurrentUser() user: any) {
    const business = await this.prisma.business.findUnique({ where: { userId: user.id } });
    if (!business) throw new ForbiddenException('Business profile not found');
    return this.payments.getBusinessTransactions(business.id);
  }

  @Post('payment-method')
  async addPaymentMethod(@CurrentUser() user: any) {
    const business = await this.prisma.business.findUnique({ where: { userId: user.id } });
    if (!business) throw new ForbiddenException('Business profile not found');
    return this.payments.setupBusinessPaymentMethod(business.id);
  }

  @Delete('payment-method')
  async removePaymentMethod(@CurrentUser() user: any) {
    const business = await this.prisma.business.findUnique({ where: { userId: user.id } });
    if (!business) throw new ForbiddenException('Business profile not found');
    return this.payments.removeBusinessPaymentMethod(business.id);
  }
}
