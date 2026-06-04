import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import bcrypt from 'bcrypt';
import type { CreateDriverDto } from './dto/create-driver.dto.js';
import type { CreateBusinessDto } from './dto/create-business.dto.js';
import type { UpdateDriverDto } from './dto/update-driver.dto.js';
import type { UpdateBusinessDto } from './dto/update-business.dto.js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ── Drivers ──────────────────────────────────────────────────────────────

  async createDriver(dto: CreateDriverDto) {
    const exists = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (exists) throw new ConflictException('Username already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email ?? null,
        passwordHash,
        role: 'DRIVER',
        driver: {
          create: {
            name: dto.name,
            phone: dto.phone,
            vehicleNumber: dto.vehicleNumber,
            vehicleType: dto.vehicleType ?? 'crane_truck',
            craneCapacityTons: dto.craneCapacityTons ?? null,
            liftHeightMeters: dto.liftHeightMeters ?? null,
          },
        },
      },
      include: { driver: true },
    });
  }

  async listDrivers() {
    return this.prisma.driver.findMany({
      include: { user: { select: { id: true, username: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriver(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true, createdAt: true } },
        jobs: {
          orderBy: { scheduledAt: 'desc' },
          take: 50,
          include: {
            business: { select: { id: true, name: true } },
            driver: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    const stats = await this.getDriverStats(id);
    return { ...driver, stats };
  }

  async updateDriver(id: string, dto: UpdateDriverDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driver.update({ where: { id }, data: dto });
  }

  async deleteDriver(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id }, include: { user: true } });
    if (!driver) throw new NotFoundException('Driver not found');
    await this.prisma.user.delete({ where: { id: driver.userId } });
    return { success: true };
  }

  private async getDriverStats(driverId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { driverId },
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

  // ── Businesses ───────────────────────────────────────────────────────────

  async createBusiness(dto: CreateBusinessDto) {
    const exists = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (exists) throw new ConflictException('Username already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email ?? null,
        passwordHash,
        role: 'BUSINESS',
        business: { create: { name: dto.name, phone: dto.phone } },
      },
      include: { business: true },
    });
  }

  async listBusinesses() {
    return this.prisma.business.findMany({
      include: { user: { select: { id: true, username: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBusiness(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true, createdAt: true } },
        jobs: {
          orderBy: { scheduledAt: 'desc' },
          take: 50,
          include: {
            business: { select: { id: true, name: true } },
            driver: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!business) throw new NotFoundException('Business not found');

    const jobs: any[] = business.jobs;
    const completed = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
    const byStatus: Record<string, number> = {
      OPEN: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, PAID: 0,
    };
    for (const j of jobs) byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
    const stats = {
      jobsByStatus: byStatus,
      totalGrossSpendCents: completed.reduce((s: number, j: any) => s + j.grossPriceCents, 0),
    };
    return { ...business, stats };
  }

  async updateBusiness(id: string, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');
    return this.prisma.business.update({ where: { id }, data: dto });
  }

  async deleteBusiness(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id }, include: { user: true } });
    if (!business) throw new NotFoundException('Business not found');
    await this.prisma.user.delete({ where: { id: business.userId } });
    return { success: true };
  }

  // ── Jobs ─────────────────────────────────────────────────────────────────

  async listAllJobs(status?: string) {
    const jobs = await this.prisma.job.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        business: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    return jobs.map((j) => ({ ...j, netPriceCents: Math.round(j.grossPriceCents * 0.9) }));
  }

  async markJobPaid(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return this.prisma.job.update({ where: { id }, data: { status: 'PAID' as any } });
  }
}
