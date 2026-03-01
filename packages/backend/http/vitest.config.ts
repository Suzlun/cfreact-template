import { fileURLToPath } from 'node:url';

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const wranglerConfigPath = fileURLToPath(new URL('../../../wrangler.toml', import.meta.url));

export default defineWorkersConfig({
  root: projectRoot,
  test: {
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'src/tests/**', '**/*.d.ts', '**/*.config.*'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    poolOptions: {
      workers: {
        wrangler: {
          configPath: wranglerConfigPath,
        },
        miniflare: {
          // テスト用の D1, KV, R2 bindings
          d1Databases: ['DB'],
          kvNamespaces: ['KV'],
          r2Buckets: ['R2'],
        },
      },
    },
  },
});
