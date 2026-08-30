import { defineConfig } from 'orval';

export default defineConfig({
  users: {
    input: {
      target: './typespec/openapi/openapi.json',
      filters: { tags: ['users'] },
    },
    output: {
      target: './src/generated/api/users/users.ts',
      client: 'hono',
      mode: 'split',
      clean: true,
      override: {
        hono: {
          handlers: './src/modules/users/handlers',
          handlerGenerationStrategy: 'smart',
          validator: true,
        },
      },
    },
  },
});
