import { fileURLToPath, URL } from 'node:url';

import { createReactCompilerPlugins } from '@cfreact-template/build-config/react-compiler';
import { defineConfig } from 'vitest/config';

/** Vitest 設定 (ui パッケージ) */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: createReactCompilerPlugins(),
  resolve: {
    alias: {
      'react-transition-group/TransitionGroupContext':
        'react-transition-group/esm/TransitionGroupContext.js',
    },
  },
  test: {
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
});
