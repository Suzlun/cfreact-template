import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import type { AppVariables } from '@cfreact-template-server/app';
import { createUsersUseCases } from '@cfreact-template-server/app';
import { helloRoute, kvDemoRoute, r2DemoRoute, usersRoute } from '@cfreact-template-server/http';
import type { Bindings } from '@cfreact-template-server/types';

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

// Middleware
app.use('*', logger());
app.use('*', async (c, next) => {
  c.set('usersUseCases', createUsersUseCases(c.env));
  c.set('kv', c.env.KV);
  c.set('r2', c.env.R2);
  await next();
});
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Routes
app.route('/api/hello', helloRoute);
app.route('/api/users', usersRoute);
app.route('/api/kv', kvDemoRoute);
app.route('/api/r2', r2DemoRoute);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
