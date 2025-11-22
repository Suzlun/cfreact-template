import { Hono } from 'hono';

import type { AppVariables } from '@server/app/context';
import type { CreateUserInput } from '@server/core/domain/users/user';
import type { Bindings } from '@server/types';

const usersRoute = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

usersRoute.get('/', async (c) => {
  const { listUsers } = c.var.usersUseCases;
  const allUsers = await listUsers.execute();
  return c.json(allUsers);
});

usersRoute.post('/', async (c) => {
  const body = await c.req.json<CreateUserInput>();
  const { createUser } = c.var.usersUseCases;

  try {
    const newUser = await createUser.execute(body);
    return c.json(newUser, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return c.json({ error: message }, 400);
  }
});

usersRoute.get('/:id', async (c) => {
  const id = Number.parseInt(c.req.param('id'), 10);

  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  const { getUser } = c.var.usersUseCases;
  const user = await getUser.execute(id);

  if (user == null) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

export default usersRoute;
