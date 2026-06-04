import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CreateSignupRequestDto } from './dto/create-signup-request.dto.js';

@Injectable()
export class SignupRequestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateSignupRequestDto) {
    const request = await this.prisma.signupRequest.create({
      data: {
        type: dto.type,
        name: dto.name.trim(),
        businessName: dto.businessName?.trim() || null,
        phone: dto.phone.trim(),
        email: dto.email?.trim() || null,
        details: dto.details?.trim() || null,
      },
    });

    // Notify every admin in real time — never let a notification failure
    // break the request submission itself.
    try {
      const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
      const typeLabel = dto.type === 'BUSINESS' ? 'עסק' : 'נהג';
      const displayName = dto.type === 'BUSINESS' ? (dto.businessName?.trim() || dto.name.trim()) : dto.name.trim();
      await Promise.all(
        admins.map((admin) =>
          this.notifications.create(
            admin.id,
            'SIGNUP_REQUEST',
            'בקשת הצטרפות חדשה',
            `${displayName} (${typeLabel}) השאיר/ה בקשת הצטרפות`,
          ),
        ),
      );
    } catch (err) {
      console.error('Failed to notify admins of signup request', err);
    }

    return request;
  }

  list() {
    return this.prisma.signupRequest.findMany({
      orderBy: [{ handled: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async setHandled(id: string, handled: boolean) {
    const req = await this.prisma.signupRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Request not found');
    return this.prisma.signupRequest.update({ where: { id }, data: { handled } });
  }

  async remove(id: string) {
    const req = await this.prisma.signupRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Request not found');
    await this.prisma.signupRequest.delete({ where: { id } });
    return { success: true };
  }
}
