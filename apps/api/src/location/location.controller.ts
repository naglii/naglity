import { Controller, Get, Post, Body, Query, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { LocationService } from './location.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

/** Time-based progress for a job's live tracking (0..1). */
function jobProgress(job: { status: string; scheduledAt: Date; estimatedEndAt: Date }): number {
  if (['COMPLETED', 'PAID'].includes(job.status)) return 1;
  if (job.status !== 'IN_PROGRESS') return 0;
  const start = new Date(job.scheduledAt).getTime();
  const end = new Date(job.estimatedEndAt).getTime();
  const now = Date.now();
  if (end <= start) return 0.5;
  return Math.min(0.95, Math.max(0.05, (now - start) / (end - start)));
}

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(
    private location: LocationService,
    private prisma: PrismaService,
  ) {}

  /** Address autocomplete. */
  @Get('search')
  search(@Query('q') q: string) {
    return this.location.search(q);
  }

  /** A route between two labels (distance, duration, polyline). */
  @Get('route')
  route(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) throw new BadRequestException('from and to are required');
    return this.location.route(from, to);
  }

  /** Batch geocode (used to place many feed jobs on the map at once). */
  @Post('geocode')
  geocode(@Body() body: { labels?: string[] }) {
    return (body?.labels ?? []).map((label) => this.location.geocode(label));
  }

  /** Live tracking for a job: route + current driver position + ETA. */
  @Get('tracking/:jobId')
  async tracking(@Param('jobId') jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { driver: { select: { name: true, vehicleNumber: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');

    const route = this.location.route((job as any).fromLocation, (job as any).toLocation);
    const progress = jobProgress(job as any);
    const position = this.location.positionAt(route, progress);
    const etaMin = Math.round(route.durationMin * (1 - progress));

    return {
      status: (job as any).status,
      title: (job as any).title,
      driverName: (job as any).driver?.name ?? null,
      vehicleNumber: (job as any).driver?.vehicleNumber ?? null,
      route,
      progress,
      position,
      etaMin,
    };
  }
}
