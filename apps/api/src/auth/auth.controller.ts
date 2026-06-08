import { Controller, Post, Body, Res, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';

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

  // Passwordless phone login — only for verified phones linked to an account.
  @Post('login/phone/send')
  @HttpCode(200)
  async loginPhoneSend(@Body('phone') phone: string) {
    return this.authService.loginPhoneSend(phone ?? '');
  }

  @Post('login/phone/verify')
  @HttpCode(200)
  async loginPhoneVerify(
    @Body('phone') phone: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: any,
  ) {
    const { accessToken, user } = await this.authService.loginPhoneVerify(phone ?? '', code ?? '');
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

  // Authenticated: sends/verifies a code for the logged-in user's own account phone.
  @Post('phone/send')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async sendPhoneCode(@CurrentUser() user: any) {
    await this.authService.sendAccountPhoneCode(user.id);
    return { ok: true };
  }

  @Post('phone/verify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async verifyPhone(@CurrentUser() user: any, @Body('code') code: string) {
    return { verified: await this.authService.verifyAccountPhone(user.id, code ?? '') };
  }

  @Post('phone/change')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async changePhone(@CurrentUser() user: any, @Body('phone') phone: string) {
    return this.authService.changeAccountPhone(user.id, phone ?? '');
  }

  @Post('logout')
  @HttpCode(200)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }
}
