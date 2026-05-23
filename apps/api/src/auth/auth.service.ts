import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    // Allow login by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
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
}
