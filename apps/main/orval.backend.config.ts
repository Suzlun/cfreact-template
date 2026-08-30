import { defineConfig } from 'orval';

const openApiInput = './typespec/openapi/openapi.json';

export default defineConfig({
  users: {
    input: {
      target: openApiInput,
      filters: { tags: ['users'] },
    },
    output: {
      target: './src/backend/generated/api/users/users.ts',
      client: 'hono',
      mode: 'split',
      clean: true,
      override: {
        hono: {
          handlers: './src/backend/modules/users/handlers',
          handlerGenerationStrategy: 'smart',
          validator: true,
        },
      },
    },
  },
  hello: {
    input: {
      target: openApiInput,
      filters: { tags: ['hello'] },
    },
    output: {
      target: './src/backend/generated/api/hello/hello.ts',
      client: 'hono',
      mode: 'split',
      clean: true,
      override: {
        hono: {
          handlers: './src/backend/modules/hello/handlers',
          handlerGenerationStrategy: 'smart',
          validator: true,
        },
      },
    },
  },
  health: {
    input: {
      target: openApiInput,
      filters: { tags: ['health'] },
    },
    output: {
      target: './src/backend/generated/api/health/health.ts',
      client: 'hono',
      mode: 'split',
      clean: true,
      override: {
        hono: {
          handlers: './src/backend/modules/health/handlers',
          handlerGenerationStrategy: 'smart',
          validator: true,
        },
      },
    },
  },
});
