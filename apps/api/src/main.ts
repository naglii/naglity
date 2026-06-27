import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { corsOrigins } from './common/cors.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env['PORT'] ?? 3001);
  console.log(`API running on http://localhost:${process.env['PORT'] ?? 3001}`);
}
bootstrap();
