import { defineConfig } from 'drizzle-kit';

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

export default defineConfig({
  out: './drizzle/migrations',
  schema: './packages/drizzle/src/schema.ts',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: getEnvVar('CLOUDFLARE_ACCOUNT_ID'),
    databaseId: getEnvVar('CLOUDFLARE_DATABASE_ID'),
    token: getEnvVar('CLOUDFLARE_D1_TOKEN'),
  },
});
