import { defineConfig } from 'vitest/config';

/**
 * Vitest monorepo projects.
 *
 * Run all tests: `pnpm test:run`
 * Run a single project: `vitest run --project frontend-app`
 */
export default defineConfig({
  test: {
    projects: [
      {
        extends: './packages/core/vitest.config.ts',
        root: './packages/core',
        test: {
          name: 'core-rules',
        },
      },
      {
        extends: './apps/main/vitest.frontend.config.ts',
        root: './apps/main',
        test: {
          name: 'frontend-app',
        },
      },
      {
        extends: './packages/ui/vitest.unit.config.ts',
        root: './packages/ui',
        test: {
          name: 'ui',
        },
      },
    ],
  },
});
