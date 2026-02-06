import { defineConfig } from 'orval';

export default defineConfig({
  sdk: {
    input: '../../api-contract/openapi/openapi.json',
    output: {
      target: './src/generated/client.ts',
      client: 'fetch',
      baseUrl: '',
      clean: true,
    },
  },
});
