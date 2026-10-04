import { defineConfig } from 'vitest/config';

/** coreの純粋で決定的な業務規則だけをNode.js上で検証する設定。 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
