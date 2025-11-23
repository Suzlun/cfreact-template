import { env as testEnv } from 'cloudflare:test';
import { beforeAll, beforeEach } from 'vitest';

import type { Bindings } from '@cfreact-template-server/types';

const env = testEnv as unknown as Bindings;

// テスト前に D1 データベースのスキーマを初期化
beforeAll(async () => {
  // users テーブルを作成
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
});

// 各テストの前にデータをクリーンアップ
beforeEach(async () => {
  await env.DB.exec('DELETE FROM users');
});
