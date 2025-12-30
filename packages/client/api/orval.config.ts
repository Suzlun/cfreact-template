import { defineConfig } from 'orval';

export default defineConfig({
  sdk: {
    input: './openapi/swagger.json',
    output: {
      target: './src/generated/client.ts',
      client: 'fetch',
      baseUrl: '',
      clean: true,
    },
  },
});
