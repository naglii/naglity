import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { JobsGateway } from '../../src/gateway/jobs.gateway';

// The real gateway emits over Socket.IO (this.server.to(...)). E2E asserts HTTP +
// DB side effects, not socket delivery, so we replace it with a no-op: any
// gateway.<method>(...) call becomes a harmless no-op and no WS server is started.
const noopGateway = new Proxy({}, { get: () => () => undefined });

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
