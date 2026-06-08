import { Controller, Post, Body, Res, HttpCode, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env['NODE_ENV'] === 'production',
  maxAge: 24 * 60 * 60 * 1000, // 24 h
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: any,
  ) {
    const { accessToken, user } = await this.authService.login(dto.identifier, dto.password);
    res.cookie('access_token', accessToken, COOKIE_OPTS);
    return { accessToken, user };
  }

  @Post('register')
  @HttpCode(200)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: any,
  ) {
    const { accessToken, user } = await this.authService.register(dto);
    res.cookie('access_token', accessToken, COOKIE_OPTS);
    return { accessToken, user };
  }

  @Post('phone/send')
  @HttpCode(200)
  async sendPhoneCode(@Body('phone') phone: string) {
    if (!phone || phone.trim().length < 5) throw new BadRequestException('נא להזין מספר טלפון תקין');
    await this.authService.sendPhoneCode(phone);
    return { ok: true };
  }

  @Post('phone/verify')
  @HttpCode(200)
  verifyPhone(@Body('phone') phone: string, @Body('code') code: string) {
    return { verified: this.authService.verifyPhone(phone ?? '', code ?? '') };
  }

  @Post('logout')
  @HttpCode(200)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }
}
