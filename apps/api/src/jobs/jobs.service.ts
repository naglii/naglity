import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JobsGateway } from '../gateway/jobs.gateway.js';
import type { CreateJobDto } from './dto/create-job.dto.js';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private gateway: JobsGateway,
  ) {}

  async createJob(userId: string, dto: CreateJobDto) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new ForbiddenException('Business profile not found');

    const job = await this.prisma.job.create({
      data: {
        ...dto,
        scheduledAt: new Date(dto.scheduledAt),
        estimatedEndAt: new Date(dto.estimatedEndAt),
        businessId: business.id,
        status: 'OPEN' as any,
      },
      include: { business: { select: { id: true, name: true } } },
    });

    const jobWithNet = { ...job, netPriceCents: Math.round((job as any).grossPriceCents * 0.9) };
    this.gateway.emitJobNew(jobWithNet);
    return jobWithNet;
  }

  async getJob(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return { ...job, netPriceCents: Math.round((job as any).grossPriceCents * 0.9) };
  }

  async acceptJob(jobId: string, userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver profile not found');
    const driverId = driver.id;

    const updatedJob = await this.prisma.$transaction(async (tx: any) => {
      const job = await tx.job.findUnique({ where: { id: jobId } });
      if (!job) throw new NotFoundException('Job not found');
      if (job.status !== 'OPEN') throw new ConflictException('Job is no longer available');

      const overlap = await tx.job.findFirst({
        where: {
          driverId,
          status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
          AND: [
            { scheduledAt: { lt: job.estimatedEndAt } },
            { estimatedEndAt: { gt: job.scheduledAt } },
          ],
        },
      });
      if (overlap) throw new ConflictException('Schedule conflict with an existing job');

      return tx.job.update({
        where: { id: jobId },
        data: { driverId, status: 'ACCEPTED' },
        include: { business: { select: { id: true, name: true, userId: true } } },
      });
    });

    this.gateway.emitJobAccepted(jobId, driverId, driver.name, (updatedJob as any).business.userId);
    return { ...updatedJob, netPriceCents: Math.round((updatedJob as any).grossPriceCents * 0.9) };
  }

  async startJob(jobId: string, userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver profile not found');

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { business: { select: { userId: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    if ((job as any).driverId !== driver.id) throw new ForbiddenException('Not your job');
    if ((job as any).status !== 'ACCEPTED') throw new ConflictException('Job must be ACCEPTED to start');

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'IN_PROGRESS' as any },
    });
    this.gateway.emitJobUpdated(jobId, 'IN_PROGRESS', (job as any).business.userId);
    return updated;
  }

  async completeJob(jobId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new ForbiddenException('Business profile not found');

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if ((job as any).businessId !== business.id) throw new ForbiddenException('Not your job');
    if (!['ACCEPTED', 'IN_PROGRESS'].includes((job as any).status)) {
      throw new ConflictException('Job cannot be completed in its current state');
    }

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' as any },
    });
    this.gateway.emitJobUpdated(jobId, 'COMPLETED', userId);
    return updated;
  }
}
