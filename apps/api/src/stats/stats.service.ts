import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const [jobs, driversCount, businessesCount] = await Promise.all([
      this.prisma.job.findMany({ select: { status: true, grossPriceCents: true } }),
      this.prisma.driver.count(),
      this.prisma.business.count(),
    ]);

    const completed = jobs.filter((j: any) => j.status === 'COMPLETED' || j.status === 'PAID');
    const paid = jobs.filter((j: any) => j.status === 'PAID');

    return {
      driversCount,
      businessesCount,
      totalJobs: jobs.length,
      jobsByStatus: {
        OPEN: jobs.filter((j: any) => j.status === 'OPEN').length,
        ACCEPTED: jobs.filter((j: any) => j.status === 'ACCEPTED').length,
        IN_PROGRESS: jobs.filter((j: any) => j.status === 'IN_PROGRESS').length,
        COMPLETED: jobs.filter((j: any) => j.status === 'COMPLETED').length,
        PAID: paid.length,
      },
      totalGrossCents: completed.reduce((s: number, j: any) => s + j.grossPriceCents, 0),
      totalPlatformRevenueCents: completed.reduce((s: number, j: any) => s + Math.round(j.grossPriceCents * 0.1), 0),
      totalDriverPayoutsCents: completed.reduce((s: number, j: any) => s + Math.round(j.grossPriceCents * 0.9), 0),
    };
  }
}
