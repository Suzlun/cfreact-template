import { Hono } from 'hono';

import type { AppVariables } from '@cfreact-template-server/app';
import type { Bindings } from '@cfreact-template-server/types';

const r2Demo = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

r2Demo.get('/:key', async (c) => {
  const key = c.req.param('key');
  const r2: AppVariables['r2'] = c.var.r2;
  const object = await r2.get(key);

  if (object === null) {
    return c.json({ error: 'Object not found' }, 404);
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      ETag: object.httpEtag,
    },
  });
});

r2Demo.post('/', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const keyValue = formData.get('key');

  if (file == null || keyValue == null || typeof keyValue !== 'string' || keyValue === '') {
    return c.json({ error: 'File and key are required' }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();

  const r2: AppVariables['r2'] = c.var.r2;
  await r2.put(keyValue, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return c.json(
    {
      message: 'File uploaded successfully',
      key: keyValue,
      size: file.size,
      contentType: file.type,
    },
    201
  );
});

r2Demo.delete('/:key', async (c) => {
  const key = c.req.param('key');
  const r2: AppVariables['r2'] = c.var.r2;
  await r2.delete(key);
  return c.json({ message: 'Object deleted successfully', key });
});

/** Demo routes for Cloudflare R2 operations. */
export default r2Demo;
