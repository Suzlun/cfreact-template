import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getOpenApiDocument } from '@cfreact-template-server/http';

const __dirname = dirname(fileURLToPath(import.meta.url));

const document = getOpenApiDocument({
  openapi: '3.0.3',
  info: {
    title: 'cfreact-template API',
    version: '1.0.0',
  },
  servers: [
    {
      url: '/',
      description: 'Default server',
    },
  ],
});

const outFile = resolve(__dirname, '../../client/api/openapi/swagger.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(document, null, 2));

console.log(`OpenAPI spec written to ${outFile}`);
