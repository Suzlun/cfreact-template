import { defineConfig } from 'orval';

export default defineConfig({
  sdk: {
    input: '../../apps/core/typespec/openapi/openapi.json',
    output: {
      target: './src/generated/client.ts',
      client: 'fetch',
      clean: true,
      override: {
        fetch: {
          useRuntimeFetcher: true,
        },
      },
    },
  },
});
