import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { user: { select: { username: true, email: true } } },
    });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return driver;
  }

  async getMyJobs(userId: string) {
    const driver = await this.getMyProfile(userId);
    return this.prisma.job.findMany({
      where: { driverId: driver.id, status: { in: ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'PAID'] as any } },
      include: { business: { select: { id: true, name: true, phone: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getMyStats(userId: string) {
    const driver = await this.getMyProfile(userId);
    const jobs = await this.prisma.job.findMany({
      where: { driverId: driver.id },
      select: { status: true, grossPriceCents: true },
    });
    const completed = jobs.filter((j: any) => j.status === 'COMPLETED' || j.status === 'PAID');
    const byStatus: Record<string, number> = {
      OPEN: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, PAID: 0,
    };
    for (const j of jobs as any[]) byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
    return {
      jobsByStatus: byStatus,
      totalNetEarningsCents: completed.reduce((s: number, j: any) => s + Math.round(j.grossPriceCents * 0.9), 0),
    };
  }

  async getAvailableFeed() {
    const jobs = await this.prisma.job.findMany({
      where: { status: 'OPEN' as any },
      include: { business: { select: { id: true, name: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
    return jobs.map((j: any) => ({ ...j, netPriceCents: Math.round(j.grossPriceCents * 0.9) }));
  }
}
