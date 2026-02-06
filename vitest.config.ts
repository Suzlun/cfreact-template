import { defineConfig } from 'vitest/config';

/**
 * Vitest monorepo projects.
 *
 * Run all tests: `pnpm test:run`
 * Run a single project: `vitest run --project server-http`
 */
export default defineConfig({
  test: {
    projects: [
      {
        extends: './packages/client/app/vitest.config.ts',
        root: './packages/client/app',
        test: {
          name: 'client-app',
        },
      },
      {
        extends: './packages/server/http/vitest.config.ts',
        root: './packages/server/http',
        test: {
          name: 'server-http',
        },
      },
      {
        extends: './packages/ui/vitest.config.ts',
        root: './packages/ui',
        test: {
          name: 'ui',
        },
      },
    ],
  },
});
