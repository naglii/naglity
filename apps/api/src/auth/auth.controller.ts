import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

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
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('access_token', { path: '/' });
    return { ok: true };
  }
}
