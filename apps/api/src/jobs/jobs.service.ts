import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JobsGateway } from '../gateway/jobs.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CreateJobDto } from './dto/create-job.dto.js';

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private gateway: JobsGateway,
    private notifications: NotificationsService,
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
        include: {
          business: { select: { id: true, name: true, userId: true } },
        },
      });
    });

    await this.prisma.jobEvent.create({
      data: { jobId, actorId: userId, type: 'ACCEPTED' as any },
    });

    const businessUserId = (updatedJob as any).business.userId;
    await this.notifications.create(
      businessUserId,
      'JOB_ACCEPTED_BY_DRIVER',
      'נהג קיבל עבודה',
      `${driver.name} קיבל את העבודה "${(updatedJob as any).title}"`,
      jobId,
    );

    this.gateway.emitJobAccepted(jobId, driverId, driver.name, businessUserId);
    return { ...updatedJob, netPriceCents: Math.round((updatedJob as any).grossPriceCents * 0.9) };
  }

  async cancelJob(jobId: string, userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver profile not found');

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { business: { select: { userId: true, name: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    if ((job as any).driverId !== driver.id) throw new ForbiddenException('Not your job');
    if (!['ACCEPTED'].includes((job as any).status)) {
      throw new ConflictException('Only ACCEPTED jobs can be cancelled');
    }
    if (isSameCalendarDay(new Date(), new Date((job as any).scheduledAt))) {
      throw new BadRequestException('Cannot cancel a job on the day it is scheduled');
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: { driverId: null, status: 'OPEN' as any },
    });

    await this.prisma.jobEvent.create({
      data: { jobId, actorId: userId, type: 'CANCELLED_BY_DRIVER' as any },
    });

    const businessUserId = (job as any).business.userId;

    await Promise.all([
      this.notifications.create(
        businessUserId,
        'JOB_CANCELLED_BY_DRIVER',
        'נהג ביטל עבודה',
        `${driver.name} ביטל את העבודה "${(job as any).title}" — העבודה חזרה לרשימת ההצעות`,
        jobId,
      ),
      this.prisma.user.findMany({ where: { role: 'ADMIN' as any } }).then((admins) =>
        Promise.all(
          admins.map((admin) =>
            this.notifications.create(
              admin.id,
              'JOB_CANCELLED_BY_DRIVER',
              'נהג ביטל עבודה',
              `${driver.name} ביטל את "${(job as any).title}" (עסק: ${(job as any).business.name})`,
              jobId,
            ),
          ),
        ),
      ),
    ]);

    const jobWithNet = { ...job, driverId: null, status: 'OPEN', netPriceCents: Math.round((job as any).grossPriceCents * 0.9) };
    this.gateway.emitJobNew(jobWithNet);
    return jobWithNet;
  }

  async deleteJob(jobId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new ForbiddenException('Business profile not found');

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { driver: { select: { userId: true, name: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    if ((job as any).businessId !== business.id) throw new ForbiddenException('Not your job');
    if (['DELETED', 'COMPLETED', 'PAID'].includes((job as any).status)) {
      throw new ConflictException('Job cannot be deleted in its current state');
    }
    if (isSameCalendarDay(new Date(), new Date((job as any).scheduledAt))) {
      throw new BadRequestException('Cannot delete a job on the day it is scheduled');
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'DELETED' as any },
    });

    await this.prisma.jobEvent.create({
      data: { jobId, actorId: userId, type: 'DELETED_BY_BUSINESS' as any },
    });

    const driverUserId = (job as any).driver?.userId;

    const notificationPromises: Promise<any>[] = [];

    if (driverUserId) {
      notificationPromises.push(
        this.notifications.create(
          driverUserId,
          'JOB_DELETED_BY_BUSINESS',
          'עבודה בוטלה על ידי העסק',
          `${business.name} ביטל את העבודה "${(job as any).title}" שקיבלת`,
          jobId,
        ),
      );
    }

    notificationPromises.push(
      this.prisma.user.findMany({ where: { role: 'ADMIN' as any } }).then((admins) =>
        Promise.all(
          admins.map((admin) =>
            this.notifications.create(
              admin.id,
              'JOB_DELETED_BY_BUSINESS',
              'עסק מחק עבודה',
              `${business.name} מחק את "${(job as any).title}"${driverUserId ? ` (היה נהג מוקצה)` : ''}`,
              jobId,
            ),
          ),
        ),
      ),
    );

    await Promise.all(notificationPromises);

    this.gateway.emitJobUpdated(jobId, 'DELETED', userId);
    return { success: true };
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

    await this.prisma.job.update({ where: { id: jobId }, data: { status: 'IN_PROGRESS' as any } });
    await this.prisma.jobEvent.create({ data: { jobId, actorId: userId, type: 'STARTED' as any } });

    this.gateway.emitJobUpdated(jobId, 'IN_PROGRESS', (job as any).business.userId);
    return { success: true };
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

    await this.prisma.job.update({ where: { id: jobId }, data: { status: 'COMPLETED' as any } });
    await this.prisma.jobEvent.create({ data: { jobId, actorId: userId, type: 'COMPLETED' as any } });

    this.gateway.emitJobUpdated(jobId, 'COMPLETED', userId);
    return { success: true };
  }
}
