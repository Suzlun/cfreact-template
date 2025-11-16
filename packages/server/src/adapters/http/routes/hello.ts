import { Hono } from 'hono';

import type { Bindings } from '@server/types.js';

const hello = new Hono<{ Bindings: Bindings }>();

hello.get('/', (c) => {
  return c.json({
    message: 'Hello from Hono + Cloudflare Workers',
    timestamp: new Date().toISOString(),
  });
});

export default hello;
