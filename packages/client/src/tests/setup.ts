import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './mocks/server.js';

// MSW サーバーの起動・停止
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  // テスト後にクリーンアップ
  cleanup();
  // MSW ハンドラーをリセット
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
