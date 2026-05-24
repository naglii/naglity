import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JobsGateway } from '../gateway/jobs.gateway.js';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: JobsGateway,
  ) {}

  async create(userId: string, type: string, title: string, body: string, jobId?: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, type: type as any, title, body, jobId },
    });
    this.gateway.emitNotification(userId, notification);
    return notification;
  }

  async getForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }
}
