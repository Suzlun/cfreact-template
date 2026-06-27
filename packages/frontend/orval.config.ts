import { defineConfig } from 'orval';

export default defineConfig({
  sdk: {
    input: '../typespec/openapi/openapi.json',
    output: {
      target: './src/api/generated/client.ts',
      client: 'fetch',
      baseUrl: '',
      clean: true,
    },
  },
});
