import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentsService } from '../payments/payments.service.js';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { userId },
      include: { user: { select: { username: true, email: true } } },
    });
    if (!business) throw new NotFoundException('Business profile not found');
    return business;
  }

  async getMyJobs(userId: string) {
    const business = await this.getMyProfile(userId);
    const jobs = await this.prisma.job.findMany({
      where: { businessId: business.id },
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        payments: { select: { type: true, status: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    return jobs.map((j: any) => ({
      ...j,
      netPriceCents: Math.round(j.grossPriceCents * 0.9),
      escrowStatus: PaymentsService.escrowStatus(j.payments),
      offerCount: j._count?.offers ?? 0,
    }));
  }

  async getMyStats(userId: string) {
    const business = await this.getMyProfile(userId);
    const jobs = await this.prisma.job.findMany({
      where: { businessId: business.id },
      select: { status: true, grossPriceCents: true },
    });
    const completed = jobs.filter((j: any) => j.status === 'PAID');
    const byStatus: Record<string, number> = {
      OPEN: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, PAID: 0,
    };
    for (const j of jobs as any[]) byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
    return {
      jobsByStatus: byStatus,
      totalGrossSpendCents: completed.reduce((s: number, j: any) => s + j.grossPriceCents, 0),
    };
  }
}
