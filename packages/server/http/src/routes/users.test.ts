import { OpenAPIHono } from '@hono/zod-openapi';
import {
  env as testEnv,
  createExecutionContext as createExecutionContextRaw,
  waitOnExecutionContext as waitOnExecutionContextRaw,
} from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { openApiApp } from '@cfreact-template-server/http';
import { DrizzleUserRepository, createDrizzleClient } from '@cfreact-template-server/persistence';
import type { Bindings } from '@cfreact-template-server/types';
import { CreateUser, GetUser, ListUsers } from '@cfreact-template-server/usecases';

interface UsersUseCases {
  listUsers: ListUsers;
  createUser: CreateUser;
  getUser: GetUser;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt?: unknown;
}

interface ErrorResponse {
  error: string;
}

const env = testEnv as unknown as Bindings;

const createUsersUseCases = () => {
  const drizzle = createDrizzleClient(env.DB);
  const repository = new DrizzleUserRepository(drizzle);

  return {
    listUsers: new ListUsers(repository),
    createUser: new CreateUser(repository),
    getUser: new GetUser(repository),
  } satisfies UsersUseCases;
};

const app = new OpenAPIHono<{
  Bindings: Bindings;
  Variables: {
    usersUseCases: UsersUseCases;
    kv: Bindings['KV'];
    r2: Bindings['R2'];
  };
}>();

app.use('*', async (c, next) => {
  c.set('usersUseCases', createUsersUseCases());
  c.set('kv', env.KV);
  c.set('r2', env.R2);
  await next();
});

app.route('/', openApiApp);

function createExecutionContext(): ExecutionContext {
  type Fn = () => ExecutionContext;
  const fn: Fn = createExecutionContextRaw as Fn;
  return fn();
}

function waitOnExecutionContext(ctx: ExecutionContext): Promise<void> {
  type Fn = (ctx: ExecutionContext) => Promise<void>;
  const fn: Fn = waitOnExecutionContextRaw as Fn;
  return fn(ctx);
}

describe('Users API', () => {
  describe('GET /api/v1/users', () => {
    it('空のリストを返す', async () => {
      const request = new Request('http://localhost/api/v1/users');
      const ctx = createExecutionContext();
      const response = await app.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json<UserResponse[]>();
      expect(data).toEqual([]);
    });

    it('既存ユーザーのリストを返す', async () => {
      await env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
        .bind('Alice', 'alice@example.com')
        .run();
      await env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
        .bind('Bob', 'bob@example.com')
        .run();

      const request = new Request('http://localhost/api/v1/users');
      const ctx = createExecutionContext();
      const response = await app.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json<UserResponse[]>();
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
      expect(data[1]).toMatchObject({ name: 'Bob', email: 'bob@example.com' });
    });
  });

  describe('POST /api/v1/users', () => {
    it('新しいユーザーを作成する', async () => {
      const newUser = {
        name: 'Charlie',
        email: 'charlie@example.com',
      };

      const request = new Request('http://localhost/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const ctx = createExecutionContext();
      const response = await app.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(201);
      const data = await response.json<UserResponse>();
      expect(data).toMatchObject(newUser);
      expect(data.id).toBeDefined();
    });

    it('名前が空の場合はエラーを返す', async () => {
      const invalidUser = {
        name: '',
        email: 'test@example.com',
      };

      const request = new Request('http://localhost/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser),
      });
      const ctx = createExecutionContext();
      const response = await app.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const data = await response.json<ErrorResponse>();
      expect(data.error).toBe('Name and email are required');
    });

    it('メールが空の場合はエラーを返す', async () => {
      const invalidUser = {
        name: 'Test User',
        email: '',
      };

      const request = new Request('http://localhost/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser),
      });
      const ctx = createExecutionContext();
      const response = await app.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const data = await response.json<ErrorResponse>();
      expect(data.error).toBe('Name and email are required');
    });

    it('重複したメールアドレスはエラーを返す', async () => {
      await env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
        .bind('Existing', 'existing@example.com')
        .run();

      const duplicateUser = {
        name: 'Duplicate',
        email: 'existing@example.com', // 同じメールアドレス
      };

      const request = new Request('http://localhost/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateUser),
      });
      const ctx = createExecutionContext();
      const response = await app.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      // UNIQUE 制約違反は usecase の例外として 400 に変換される
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('指定されたIDのユーザーを返す', async () => {
      const createRequest = new Request('http://localhost/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'David', email: 'david@example.com' }),
      });
      const createCtx = createExecutionContext();
      const createResponse = await app.fetch(createRequest, env, createCtx);
      await waitOnExecutionContext(createCtx);

      expect(createResponse.status).toBe(201);
      const createdUser = await createResponse.json<UserResponse>();

      const request = new Request(`http://localhost/api/v1/users/${String(createdUser.id)}`);
      const ctx = createExecutionContext();
      const response = await app.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json<UserResponse>();
      expect(data).toMatchObject({
        id: createdUser.id,
        name: 'David',
        email: 'david@example.com',
      });
    });

    it('存在しないIDの場合は404を返す', async () => {
      const request = new Request('http://localhost/api/v1/users/999');
      const ctx = createExecutionContext();
      const response = await app.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      const data = await response.json<ErrorResponse>();
      expect(data.error).toBe('User not found');
    });
  });
});
