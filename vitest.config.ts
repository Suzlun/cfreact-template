import { defineConfig } from 'vitest/config';

/**
 * Vitest monorepo projects.
 *
 * Run all tests: `pnpm test:run`
 * Run a single project: `vitest run --project backend-http`
 */
export default defineConfig({
  test: {
    projects: [
      {
        extends: './packages/frontend/vitest.app.config.ts',
        root: './packages/frontend',
        test: {
          name: 'frontend-app',
        },
      },
      {
        extends: './packages/backend/vitest.http.config.ts',
        root: './packages/backend',
        test: {
          name: 'backend-http',
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
