import { defineConfig } from 'orval';

export default defineConfig({
  sdk: {
    input: '../core/typespec/openapi/openapi.json',
    output: {
      target: './src/generated/client.ts',
      client: 'fetch',
      baseUrl: 'https://core.internal',
      clean: true,
      override: {
        fetch: {
          useRuntimeFetcher: true,
        },
      },
    },
  },
});
