import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import hello from './routes/hello.js';
import kvDemo from './routes/kv-demo.js';
import r2Demo from './routes/r2-demo.js';
import usersRoute from './routes/users.js';

import type { Bindings } from './types.js';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
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
