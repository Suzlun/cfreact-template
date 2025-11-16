import { users } from '@cfreact-template/drizzle';
import {
  env as testEnv,
  createExecutionContext as createExecutionContextRaw,
  waitOnExecutionContext as waitOnExecutionContextRaw,
} from 'cloudflare:test';
import { drizzle } from 'drizzle-orm/d1';
import { describe, it, expect } from 'vitest';

import worker from '../index.js';

import type { Bindings } from '../types.js';

const env = testEnv as unknown as Bindings;

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
  describe('GET /api/users', () => {
    it('空のリストを返す', async () => {
      const request = new Request('http://localhost/api/users');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it('既存ユーザーのリストを返す', async () => {
      // テストデータを挿入
      const db = drizzle(env.DB);
      await db.insert(users).values([
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ]);

      const request = new Request('http://localhost/api/users');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
      expect(data[1]).toMatchObject({ name: 'Bob', email: 'bob@example.com' });
    });
  });

  describe('POST /api/users', () => {
    it('新しいユーザーを作成する', async () => {
      const newUser = {
        name: 'Charlie',
        email: 'charlie@example.com',
      };

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toMatchObject(newUser);
      expect(data.id).toBeDefined();
    });

    it('名前が空の場合はエラーを返す', async () => {
      const invalidUser = {
        name: '',
        email: 'test@example.com',
      };

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Name and email are required');
    });

    it('メールが空の場合はエラーを返す', async () => {
      const invalidUser = {
        name: 'Test User',
        email: '',
      };

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Name and email are required');
    });

    it('重複したメールアドレスはエラーを返す', async () => {
      const db = drizzle(env.DB);
      const existingUser = { name: 'Existing', email: 'existing@example.com' };
      await db.insert(users).values(existingUser);

      const duplicateUser = {
        name: 'Duplicate',
        email: 'existing@example.com', // 同じメールアドレス
      };

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateUser),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      // SQLite の UNIQUE 制約違反でエラーになる
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/users/:id', () => {
    it('指定されたIDのユーザーを返す', async () => {
      const db = drizzle(env.DB);
      const [insertedUser] = await db
        .insert(users)
        .values({ name: 'David', email: 'david@example.com' })
        .returning();

      const request = new Request(`http://localhost/api/users/${String(insertedUser.id)}`);
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({
        id: insertedUser.id,
        name: 'David',
        email: 'david@example.com',
      });
    });

    it('存在しないIDの場合は404を返す', async () => {
      const request = new Request('http://localhost/api/users/999');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });
  });
});
