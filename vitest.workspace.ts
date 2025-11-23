import { defineWorkspace as defineWorkspaceRaw } from 'vitest/config';

import type { WorkspaceSpec } from 'vitest/config';

function defineWorkspace(config: WorkspaceSpec[]): WorkspaceSpec[] {
  type Fn = (config: WorkspaceSpec[]) => WorkspaceSpec[];
  const fn: Fn = defineWorkspaceRaw as Fn;
  return fn(config);
}

/**
 * Vitest Workspace 設定
 * モノレポ内の各パッケージのテストを統合管理
 */
export default defineWorkspace([
  {
    // Client App パッケージ（React）
    extends: './packages/client/app/vitest.config.ts',
    test: {
      name: 'client-app',
      environment: 'jsdom',
    },
  },
  {
    // Server パッケージ（Hono + Cloudflare Workers）
    extends: './packages/server/http/vitest.config.ts',
    test: {
      name: 'server-http',
      pool: '@cloudflare/vitest-pool-workers',
    },
  },
  {
    // UI パッケージ（共有UIコンポーネント）
    extends: './packages/ui/vitest.config.ts',
    test: {
      name: 'ui',
      environment: 'jsdom',
    },
  },
  // Drizzle パッケージは型定義のみなのでテスト不要
]);
