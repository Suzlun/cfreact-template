import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

// MSW が import 時に Node.js の実験的 localStorage getter を参照しないように、先に安全な値で上書きする。
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
  writable: true,
});

// localStorage の上書き後に MSW 関連モジュールを読み込み、Node.js の warning を発生させない。
const [{ resetMockData }, { server }] = await Promise.all([
  import('./mocks/handlers'),
  import('./mocks/server'),
]);

// MSW サーバーの起動・停止
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  // テスト後にクリーンアップ
  cleanup();
  // MSW のデータを初期状態に戻す
  resetMockData();
  // MSW ハンドラーをリセット
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
