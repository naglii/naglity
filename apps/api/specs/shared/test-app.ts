import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { JobsGateway } from '../../src/gateway/jobs.gateway';

// The real gateway emits over Socket.IO (this.server.to(...)). E2E asserts HTTP +
// DB side effects, not socket delivery, so we replace it with no-ops and no WS
// server is started. NOTE: must be a plain object, not a Proxy — a catch-all
// Proxy also traps `.then`, which makes Nest's async DI treat it as a thenable
// that never resolves (the app hangs on init).
const noopGateway = {
  emitJobNew: () => undefined,
  emitJobAccepted: () => undefined,
  emitJobUpdated: () => undefined,
  emitNotification: () => undefined,
};

/**
 * Boots the full Nest application wired exactly like production (global `api`
 * prefix, cookie-parser, validation pipe) but with the gateway no-op'd.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(JobsGateway)
    .useValue(noopGateway)
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
