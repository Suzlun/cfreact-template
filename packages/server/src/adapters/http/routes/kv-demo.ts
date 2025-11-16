import { Hono } from 'hono';

import type { AppVariables } from '@server/app/context.js';
import type { Bindings } from '@server/types.js';

const kvDemo = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

kvDemo.get('/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.var.kv.get(key);

  if (value === null) {
    return c.json({ error: 'Key not found' }, 404);
  }

  return c.json({ key, value });
});

kvDemo.post('/', async (c) => {
  const { key, value } = await c.req.json<{ key: string; value: string }>();

  if (key === '' || value === '') {
    return c.json({ error: 'Key and value are required' }, 400);
  }

  await c.var.kv.put(key, value);
  return c.json({ message: 'Key-value pair stored successfully', key, value }, 201);
});

kvDemo.delete('/:key', async (c) => {
  const key = c.req.param('key');
  await c.var.kv.delete(key);
  return c.json({ message: 'Key deleted successfully', key });
});

export default kvDemo;
