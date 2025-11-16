import reactPlugin from '@vitejs/plugin-react';
import { defineConfig as defineConfigRaw } from 'vitest/config';

import type { PluginOption, UserConfig } from 'vite';

function react(): PluginOption {
  type Fn = () => PluginOption;
  const fn: Fn = reactPlugin as Fn;
  return fn();
}

function defineConfig(config: UserConfig): UserConfig {
  type Fn = (config: UserConfig) => UserConfig;
  const fn: Fn = defineConfigRaw as Fn;
  return fn(config);
}

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        'src/theme.ts', // テーマ設定は除外
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
