import { Hono, type MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import usersApi from '@cfreact-template/core/generated/api/users/users';
import { inspectSafeErrorResponse } from '@cfreact-template/core/platform/http/responseValidation';
import { logFailure } from '@cfreact-template/core/platform/observability/logger';

import { createServices } from './services';

import type { components } from '@cfreact-template/core/generated/api/openapi';
import type { Bindings } from '@cfreact-template/core/types';

type CoreVariables = ReturnType<typeof createServices>;

const invalidRequestResponse = {
  code: 'INVALID_REQUEST',
  message: 'Invalid request',
} satisfies components['schemas']['InvalidRequestError'];

const notFoundResponse = {
  code: 'INVALID_REQUEST',
  message: 'Not found',
} satisfies components['schemas']['InvalidRequestError'];

const internalErrorResponse = {
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
} satisfies components['schemas']['InternalError'];

const app = new Hono<{ Bindings: Bindings; Variables: CoreVariables }>();

app.use('*', logger());

// 外部所有HTTPサブツリーは、core契約のミドルウェアより前に必要な場合だけ明示的にマウントする。

app.use('/internal/v1/users/*', async (c, next) => {
  const services = createServices(c.env);
  c.set('usersService', services.usersService);
  await next();
});

const normalizeCoreBadRequest: MiddlewareHandler = async (c, next) => {
  await next();
  if (c.res.status !== 400) {
    return;
  }

  const inspection = await inspectSafeErrorResponse(c.res);
  if (!inspection.safe) {
    c.res = c.json(invalidRequestResponse, 400);
  }
};
app.use('/internal/*', normalizeCoreBadRequest);

app.route('/', usersApi);

app.notFound((c) => c.json(notFoundResponse, 404));

app.onError((error, c) => {
  if (error instanceof HTTPException && error.status === 400) {
    return c.json(invalidRequestResponse, 400);
  }

  logFailure('http.unhandled-error', error);
  return c.json(internalErrorResponse, 500);
});

/** Service Bindingへ公開する非公開core Honoアプリ。 */
export default app;
