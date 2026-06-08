import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { SmsService } from '../sms/sms.service.js';
import bcrypt from 'bcrypt';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private sms: SmsService,
  ) {}

  /** Send an SMS code to the logged-in user's account phone (fake provider logs "0000"). */
  async sendAccountPhoneCode(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new BadRequestException('אין מספר טלפון בחשבון');
    await this.sms.sendCode(business.phone);
  }

  /** Verify a code against the user's account phone; on success mark the account verified. */
  async verifyAccountPhone(userId: string, code: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new BadRequestException('אין מספר טלפון בחשבון');
    const ok = this.sms.verifyCode(business.phone, code);
    if (ok && !(business as any).phoneVerified) {
      await this.prisma.business.update({ where: { id: business.id }, data: { phoneVerified: true } });
    }
    return ok;
  }

  /** Change the account phone (resets verification) and send a code to the new number. */
  async changeAccountPhone(userId: string, phone: string) {
    const trimmed = (phone ?? '').trim();
    if (trimmed.length < 5) throw new BadRequestException('מספר טלפון לא תקין');
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new BadRequestException('אין מספר טלפון בחשבון');
    await this.prisma.business.update({ where: { id: business.id }, data: { phone: trimmed, phoneVerified: false } });
    await this.sms.sendCode(trimmed);
    return { phone: trimmed };
  }

  async login(identifier: string, password: string) {
    // Allow login by username or email, case-insensitively
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    let profileId: string | null = null;
    let accountType: string | null = null;
    let phoneVerified = true;
    if (user.role === 'DRIVER') {
      const driver = await this.prisma.driver.findUnique({ where: { userId: user.id } });
      profileId = driver?.id ?? null;
    } else if (user.role === 'BUSINESS') {
      const business = await this.prisma.business.findUnique({ where: { userId: user.id } });
      profileId = business?.id ?? null;
      accountType = (business as any)?.accountType ?? null;
      phoneVerified = (business as any)?.phoneVerified ?? true;
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, profileId, accountType, phoneVerified },
    };
  }

  /** Self-serve customer signup: creates an unverified INDIVIDUAL client account and logs them in. */
  async register(dto: RegisterDto) {
    const orClauses: any[] = [{ username: { equals: dto.username, mode: 'insensitive' } }];
    if (dto.email) orClauses.push({ email: { equals: dto.email, mode: 'insensitive' } });
    const exists = await this.prisma.user.findFirst({ where: { OR: orClauses } });
    if (exists) throw new ConflictException('שם המשתמש או האימייל כבר בשימוש');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email ?? null,
        passwordHash,
        role: 'BUSINESS',
        business: {
          create: {
            name: dto.name,
            phone: dto.phone,
            location: dto.location ?? null,
            accountType: 'INDIVIDUAL',
            phoneVerified: false,
          },
        },
      },
      include: { business: true },
    });

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileId: user.business?.id ?? null,
        accountType: user.business?.accountType ?? 'INDIVIDUAL',
        phoneVerified: (user.business as any)?.phoneVerified ?? false,
      },
    };
  }
}
