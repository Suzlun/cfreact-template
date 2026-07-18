import { fileURLToPath, URL } from 'node:url';

import { createReactCompilerPlugins } from '@cfreact-template/build-config/react-compiler';
import { defineConfig } from 'vitest/config';

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
    include: ['src/app/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/app/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/app/tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
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
