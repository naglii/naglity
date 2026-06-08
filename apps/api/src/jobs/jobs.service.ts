import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JobsGateway } from '../gateway/jobs.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import type { CreateJobDto } from './dto/create-job.dto.js';
import type { CreateOfferDto } from './dto/create-offer.dto.js';
import type { CreateReviewDto } from './dto/create-review.dto.js';

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
    private payments: PaymentsService,
  ) {}

  async createJob(userId: string, dto: CreateJobDto) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new ForbiddenException('Business profile not found');
    if (!(business as any).phoneVerified) {
      throw new BadRequestException('יש לאמת את מספר הטלפון לפני פרסום עבודה');
    }
    if (!business.hasPaymentMethod) {
      throw new BadRequestException('יש להוסיף אמצעי תשלום לפני פרסום עבודה');
    }

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

  async getReceipt(jobId: string, user: { id: string; role: string }) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        business: { select: { name: true, phone: true, userId: true } },
        driver: { select: { name: true, phone: true, userId: true } },
        payments: { select: { type: true, status: true, amountCents: true, createdAt: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    const isAdmin = user.role === 'ADMIN';
    const isOwner = (job as any).business?.userId === user.id;
    const isDriver = (job as any).driver?.userId === user.id;
    if (!isAdmin && !isOwner && !isDriver) throw new ForbiddenException('Not allowed');

    const gross = (job as any).grossPriceCents;
    const platformFeeCents = Math.round(gross * 0.1);
    const netCents = gross - platformFeeCents;
    const find = (t: string) => (job as any).payments.find((p: any) => p.type === t && p.status === 'SUCCEEDED');
    const charge = find('CHARGE');
    const transfer = find('TRANSFER');
    const refund = find('REFUND');

    return {
      invoiceNumber: `NG-${jobId.slice(-8).toUpperCase()}`,
      issuedAt: charge?.createdAt ?? (job as any).createdAt,
      job: {
        id: jobId,
        title: (job as any).title,
        scheduledAt: (job as any).scheduledAt,
        fromLocation: (job as any).fromLocation,
        toLocation: (job as any).toLocation,
      },
      businessName: (job as any).business?.name ?? null,
      driverName: (job as any).driver?.name ?? null,
      grossCents: gross,
      platformFeeCents,
      netCents,
      charged: !!charge,
      chargedAt: charge?.createdAt ?? null,
      released: !!transfer,
      releasedAt: transfer?.createdAt ?? null,
      refunded: !!refund,
      refundedAt: refund?.createdAt ?? null,
    };
  }

  async acceptJob(jobId: string, userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver profile not found');
    if (!driver.payoutsEnabled) {
      throw new BadRequestException('יש להגדיר אמצעי לקבלת תשלום לפני קבלת עבודות');
    }
    const driverId = driver.id;

    const updatedJob = await this.prisma.$transaction(async (tx: any) => {
      const job = await tx.job.findUnique({ where: { id: jobId } });
      if (!job) throw new NotFoundException('Job not found');
      if (job.status !== 'OPEN') throw new ConflictException('Job is no longer available');
      if (job.pricingMode === 'OFFERS') throw new BadRequestException('עבודה זו פתוחה להצעות — שלח הצעה');

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
          business: { select: { id: true, name: true, userId: true, stripeCustomerId: true } },
        },
      });
    });

    // Charge the business off-session now that a driver accepted. If the charge
    // fails, release the job back to OPEN so it returns to the feed.
    try {
      await this.payments.chargeForJob(
        { id: jobId, grossPriceCents: (updatedJob as any).grossPriceCents },
        { stripeCustomerId: (updatedJob as any).business.stripeCustomerId },
      );
    } catch {
      await this.prisma.job.update({ where: { id: jobId }, data: { driverId: null, status: 'OPEN' as any } });
      const reopened = { ...updatedJob, driverId: null, status: 'OPEN', netPriceCents: Math.round((updatedJob as any).grossPriceCents * 0.9) };
      this.gateway.emitJobNew(reopened);
      // Let the business know their card was declined so they can fix it.
      await this.notifications.create(
        (updatedJob as any).business.userId,
        'PAYMENT_FAILED',
        'החיוב נכשל',
        `לא ניתן היה לחייב עבור "${(updatedJob as any).title}" — עדכן את אמצעי התשלום`,
        jobId,
      ).catch(() => {});
      throw new BadRequestException('לא ניתן לחייב את אמצעי התשלום של העסק — נסה עבודה אחרת');
    }

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

    // Driver backed out → refund the business; the job goes back to the feed.
    await this.payments.refundForJob(jobId);

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
    // A booked job cannot be deleted on its day (protects the assigned driver).
    if ((job as any).driverId && isSameCalendarDay(new Date(), new Date((job as any).scheduledAt))) {
      throw new BadRequestException('לא ניתן למחוק עבודה משובצת ביום העבודה');
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'DELETED' as any },
    });

    // If a driver had accepted, the business was charged → refund it.
    await this.payments.refundForJob(jobId);

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
    if (!isSameCalendarDay(new Date(), new Date((job as any).scheduledAt))) {
      throw new BadRequestException('ניתן להתחיל עבודה רק ביום שבו היא מתוכננת');
    }

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

    await this.prisma.jobEvent.create({ data: { jobId, actorId: userId, type: 'COMPLETED' as any } });

    // Release the driver's 90% from escrow. On success the job is settled (PAID);
    // if the payout fails it stays COMPLETED (awaiting payout) for admin to retry.
    let released: any = null;
    if ((job as any).driverId) {
      const driver = await this.prisma.driver.findUnique({ where: { id: (job as any).driverId } });
      if (driver) {
        released = await this.payments.releaseToDriver(
          { id: jobId, grossPriceCents: (job as any).grossPriceCents },
          { stripeAccountId: driver.stripeAccountId },
        );
      }
    }
    const newStatus = released?.status === 'SUCCEEDED' ? 'PAID' : 'COMPLETED';
    await this.prisma.job.update({ where: { id: jobId }, data: { status: newStatus as any } });

    this.gateway.emitJobUpdated(jobId, newStatus, userId);
    return { success: true };
  }

  // ── Offers (open-to-offers jobs) ───────────────────────────────────────────

  /** A driver submits/updates a quote on an OFFERS job. */
  async submitOffer(jobId: string, userId: string, dto: CreateOfferDto) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver profile not found');
    if (!driver.payoutsEnabled) {
      throw new BadRequestException('יש להגדיר אמצעי לקבלת תשלום לפני שליחת הצעה');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { business: { select: { userId: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    if ((job as any).pricingMode !== 'OFFERS') throw new BadRequestException('עבודה זו אינה פתוחה להצעות');
    if ((job as any).status !== 'OPEN') throw new ConflictException('העבודה כבר אינה פתוחה');

    const offer = await this.prisma.jobOffer.upsert({
      where: { jobId_driverId: { jobId, driverId: driver.id } },
      create: { jobId, driverId: driver.id, amountCents: dto.amountCents, note: dto.note ?? null, etaMinutes: dto.etaMinutes ?? null, status: 'PENDING' },
      update: { amountCents: dto.amountCents, note: dto.note ?? null, etaMinutes: dto.etaMinutes ?? null, status: 'PENDING' },
    });

    await this.notifications.create(
      (job as any).business.userId,
      'NEW_OFFER',
      'הצעה חדשה',
      `${driver.name} הציע ₪${Math.round(dto.amountCents / 100)} עבור "${(job as any).title}"`,
      jobId,
    );
    this.gateway.emitJobUpdated(jobId, (job as any).status, (job as any).business.userId);
    return offer;
  }

  /** Offers on a job, for the owning poster. No driver phone numbers exposed. */
  async listOffers(jobId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new ForbiddenException('Business profile not found');
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if ((job as any).businessId !== business.id) throw new ForbiddenException('Not your job');

    const offers = await this.prisma.jobOffer.findMany({
      where: { jobId },
      include: { driver: { select: { id: true, name: true, vehicleType: true, craneCapacityTons: true, liftHeightMeters: true } } },
      orderBy: [{ status: 'asc' }, { amountCents: 'asc' }],
    });

    // Attach each driver's rating (no phone — privacy).
    const withRating = await Promise.all(
      offers.map(async (o: any) => ({ ...o, driver: { ...o.driver, rating: await this.driverRating(o.driverId) } })),
    );
    return withRating;
  }

  /** The poster picks a driver's offer → assign, set the price, charge escrow. */
  async acceptOffer(jobId: string, offerId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new ForbiddenException('Business profile not found');

    const offer = await this.prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: {
        driver: { select: { id: true, name: true, userId: true } },
        job: { include: { business: { select: { userId: true, stripeCustomerId: true } } } },
      },
    });
    if (!offer || (offer as any).jobId !== jobId) throw new NotFoundException('Offer not found');
    const job = (offer as any).job;
    if (job.businessId !== business.id) throw new ForbiddenException('Not your job');
    if (job.status !== 'OPEN') throw new ConflictException('העבודה כבר אינה פתוחה');

    const originalPrice = job.grossPriceCents;

    await this.prisma.$transaction(async (tx: any) => {
      const fresh = await tx.job.findUnique({ where: { id: jobId } });
      if (!fresh || fresh.status !== 'OPEN') throw new ConflictException('העבודה כבר אינה פתוחה');
      await tx.job.update({
        where: { id: jobId },
        data: { driverId: (offer as any).driverId, grossPriceCents: (offer as any).amountCents, status: 'ACCEPTED' },
      });
    });

    // Charge the poster for the agreed offer amount; revert on failure.
    try {
      await this.payments.chargeForJob(
        { id: jobId, grossPriceCents: (offer as any).amountCents },
        { stripeCustomerId: job.business.stripeCustomerId },
      );
    } catch {
      await this.prisma.job.update({ where: { id: jobId }, data: { driverId: null, status: 'OPEN' as any, grossPriceCents: originalPrice } });
      await this.notifications.create(
        job.business.userId,
        'PAYMENT_FAILED',
        'החיוב נכשל',
        `לא ניתן היה לחייב עבור "${job.title}" — עדכן את אמצעי התשלום`,
        jobId,
      ).catch(() => {});
      throw new BadRequestException('לא ניתן לחייב את אמצעי התשלום — נסה שוב');
    }

    await this.prisma.jobOffer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } });
    await this.prisma.jobOffer.updateMany({ where: { jobId, id: { not: offerId }, status: 'PENDING' }, data: { status: 'DECLINED' } });
    await this.prisma.jobEvent.create({ data: { jobId, actorId: userId, type: 'ACCEPTED' as any } });

    await this.notifications.create(
      (offer as any).driver.userId,
      'OFFER_ACCEPTED',
      'ההצעה התקבלה 🎉',
      `ההצעה שלך עבור "${job.title}" התקבלה`,
      jobId,
    );
    const declined = await this.prisma.jobOffer.findMany({
      where: { jobId, status: 'DECLINED' },
      include: { driver: { select: { userId: true } } },
    });
    await Promise.all(
      declined.map((o: any) =>
        this.notifications.create(o.driver.userId, 'OFFER_DECLINED', 'ההצעה לא נבחרה', `העבודה "${job.title}" שובצה לנהג אחר`, jobId).catch(() => {}),
      ),
    );

    this.gateway.emitJobAccepted(jobId, (offer as any).driverId, (offer as any).driver.name, job.business.userId);
    return { success: true };
  }

  /** A driver's own submitted offers. */
  async myOffers(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new ForbiddenException('Driver profile not found');
    return this.prisma.jobOffer.findMany({
      where: { driverId: driver.id },
      include: {
        job: { select: { id: true, title: true, fromLocation: true, toLocation: true, scheduledAt: true, status: true, grossPriceCents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Average rating + count for a driver (from completed-job reviews). */
  async driverRating(driverId: string): Promise<{ avg: number; count: number }> {
    const reviews = await this.prisma.review.findMany({
      where: { direction: 'BUSINESS_TO_DRIVER', job: { driverId } },
      select: { stars: true },
    });
    if (reviews.length === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((s: number, r: any) => s + r.stars, 0);
    return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
  }

  /** A poster invites a specific driver (from the directory) to an open job. */
  async inviteDriver(jobId: string, driverId: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new ForbiddenException('Business profile not found');
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if ((job as any).businessId !== business.id) throw new ForbiddenException('Not your job');
    if ((job as any).status !== 'OPEN') throw new ConflictException('ניתן להזמין רק לעבודה פתוחה');

    const driver = await this.prisma.driver.findUnique({ where: { id: driverId }, select: { userId: true } });
    if (!driver) throw new NotFoundException('Driver not found');

    await this.notifications.create(
      driver.userId,
      'JOB_INVITE',
      'הוזמנת לעבודה',
      `${business.name} הזמין אותך לעבודה "${(job as any).title}"`,
      jobId,
    );
    return { success: true };
  }

  /** Leave a 1–5 star review after a job completes (business→driver or driver→business). */
  async submitReview(jobId: string, userId: string, dto: CreateReviewDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { business: { select: { userId: true } }, driver: { select: { userId: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (!['COMPLETED', 'PAID'].includes((job as any).status)) {
      throw new BadRequestException('ניתן לדרג רק לאחר סיום העבודה');
    }
    const isOwner = (job as any).business?.userId === userId;
    const isDriver = (job as any).driver?.userId === userId;
    if (!isOwner && !isDriver) throw new ForbiddenException('Not allowed');

    const direction = isOwner ? 'BUSINESS_TO_DRIVER' : 'DRIVER_TO_BUSINESS';
    const review = await this.prisma.review.upsert({
      where: { jobId_raterId: { jobId, raterId: userId } },
      create: { jobId, raterId: userId, direction, stars: dto.stars, comment: dto.comment ?? null },
      update: { direction, stars: dto.stars, comment: dto.comment ?? null },
    });

    const rateeUserId = isOwner ? (job as any).driver?.userId : (job as any).business?.userId;
    if (rateeUserId) {
      await this.notifications
        .create(rateeUserId, 'NEW_REVIEW', 'קיבלת דירוג חדש', `דירוג ${dto.stars}★ עבור "${(job as any).title}"`, jobId)
        .catch(() => {});
    }
    return review;
  }
}
