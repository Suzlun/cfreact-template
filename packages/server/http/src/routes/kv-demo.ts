import { Hono } from 'hono';

import type { AppVariables } from '@cfreact-template-server/app';
import type { Bindings } from '@cfreact-template-server/types';

const kvDemo = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

kvDemo.get('/:key', async (c) => {
  const key = c.req.param('key');
  const kv: AppVariables['kv'] = c.var.kv;
  const value = await kv.get(key);

  if (value === null) {
    return c.json({ error: 'Key not found' }, 404);
  }

  return c.json({ key, value });
});

kvDemo.post('/', async (c) => {
  const { key, value } = await c.req.json<{ key: string; value: string }>();
  const kv: AppVariables['kv'] = c.var.kv;

  if (key === '' || value === '') {
    return c.json({ error: 'Key and value are required' }, 400);
  }

  await kv.put(key, value);
  return c.json({ message: 'Key-value pair stored successfully', key, value }, 201);
});

kvDemo.delete('/:key', async (c) => {
  const key = c.req.param('key');
  const kv: AppVariables['kv'] = c.var.kv;
  await kv.delete(key);
  return c.json({ message: 'Key deleted successfully', key });
});

/** Demo routes for Cloudflare KV operations. */
export default kvDemo;
