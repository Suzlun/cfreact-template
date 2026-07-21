import { fileURLToPath, URL } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from '#vite-config';

/**
 * UI パッケージの jsdom 単体テスト設定。
 *
 * Storybook の実ブラウザテストから分離し、従来の `ui` project 名と coverage 基準を維持する。
 */
const unitTestConfig = mergeConfig(
  viteConfig,
  defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    test: {
      name: 'ui',
      globals: true,
      environment: 'jsdom',
      include: ['**/*.{test,spec}.{ts,tsx}'],
      setupFiles: ['./tests/setup.ts'],
      exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/**', 'tests/**', '**/*.d.ts', '**/*.config.*'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
    },
  })
);

/** UI の jsdom 単体テスト設定を公開する。 */
export default unitTestConfig;
