import { users, type NewUser } from '@cfreact-template/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';

import type { Bindings } from '../types.js';

const usersRoute = new Hono<{ Bindings: Bindings }>();

usersRoute.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const allUsers = await db.select().from(users).all();
  return c.json(allUsers);
});

usersRoute.post('/', async (c) => {
  const body = await c.req.json<NewUser>();

  if (body.name === '' || body.email === '') {
    return c.json({ error: 'Name and email are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const newUser = await db.insert(users).values(body).returning();

  return c.json(newUser[0], 201);
});

usersRoute.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = drizzle(c.env.DB);

  const user = await db
    .select()
    .from(users)
    .where((row) => row.id === id)
    .get();

  if (user == null) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

export default usersRoute;
