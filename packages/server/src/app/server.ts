import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import hello from '@server/adapters/http/routes/hello.js';
import kvDemo from '@server/adapters/http/routes/kv-demo.js';
import r2Demo from '@server/adapters/http/routes/r2-demo.js';
import usersRoute from '@server/adapters/http/routes/users.js';
import type { AppVariables } from '@server/app/context.js';
import { createUsersUseCases } from '@server/app/dependencies/users.js';
import type { Bindings } from '@server/types.js';

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
app.route('/api/hello', hello);
app.route('/api/users', usersRoute);
app.route('/api/kv', kvDemo);
app.route('/api/r2', r2Demo);

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
