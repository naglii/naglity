import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import bcrypt from 'bcrypt';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

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
    if (user.role === 'DRIVER') {
      const driver = await this.prisma.driver.findUnique({ where: { userId: user.id } });
      profileId = driver?.id ?? null;
    } else if (user.role === 'BUSINESS') {
      const business = await this.prisma.business.findUnique({ where: { userId: user.id } });
      profileId = business?.id ?? null;
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, profileId },
    };
  }

  /** Self-serve customer signup: creates an INDIVIDUAL client account and logs them in. */
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
      },
    };
  }
}
