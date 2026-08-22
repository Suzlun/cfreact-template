import { defineConfig } from 'vitest/config';

/**
 * バックエンドの純粋で決定的な業務規則だけをNode.js上で検証する設定。
 *
 * データベース、ネットワーク、ファイルシステム、サーバー、Workerdへ接続する試験は対象にしない。
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
