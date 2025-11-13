import { Hono } from 'hono';
import type { Bindings } from '../types.js';

const r2Demo = new Hono<{ Bindings: Bindings }>();

r2Demo.get('/:key', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.R2.get(key);

  if (object === null) {
    return c.json({ error: 'Object not found' }, 404);
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      ETag: object.httpEtag,
    },
  });
});

r2Demo.post('/', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const key = formData.get('key');

  if (!file || !key) {
    return c.json({ error: 'File and key are required' }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();

  await c.env.R2.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return c.json(
    {
      message: 'File uploaded successfully',
      key,
      size: file.size,
      contentType: file.type,
    },
    201
  );
});

r2Demo.delete('/:key', async (c) => {
  const key = c.req.param('key');
  await c.env.R2.delete(key);
  return c.json({ message: 'Object deleted successfully', key });
});

export default r2Demo;
