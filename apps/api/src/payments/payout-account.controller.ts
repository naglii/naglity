import { Controller, Get, Post, Delete, UseGuards, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('drivers/me/payout-account')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DRIVER')
export class PayoutAccountController {
  constructor(
    private payments: PaymentsService,
    private prisma: PrismaService,
  ) {}

  private async driver(userId: string) {
    const d = await this.prisma.driver.findUnique({ where: { userId } });
    if (!d) throw new ForbiddenException('Driver profile not found');
    return d;
  }

  @Get()
  async status(@CurrentUser() user: any) {
    const d = await this.driver(user.id);
    return { payoutsEnabled: d.payoutsEnabled, provider: this.payments.providerName, payoutLast4: d.payoutLast4 };
  }

  @Post()
  async setup(@CurrentUser() user: any) {
    const d = await this.driver(user.id);
    return this.payments.setupDriverPayoutAccount(d.id);
  }

  @Delete()
  async remove(@CurrentUser() user: any) {
    const d = await this.driver(user.id);
    return this.payments.removeDriverPayoutAccount(d.id);
  }
}
