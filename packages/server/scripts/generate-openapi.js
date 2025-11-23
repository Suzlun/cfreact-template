/* eslint-env node -- use Node.js globals in this script */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'cfreact-template API',
    version: '1.0.0',
  },
  servers: [
    {
      url: '/api',
      description: 'Default server',
    },
  ],
  paths: {
    '/hello': {
      get: {
        operationId: 'getHello',
        summary: 'Returns greeting',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HelloResponse',
                },
              },
            },
          },
        },
      },
    },
    '/users': {
      get: {
        operationId: 'listUsers',
        summary: 'List all users',
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createUser',
        summary: 'Create a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserInput',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        operationId: 'getUser',
        summary: 'Get a user by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
              format: 'int64',
            },
          },
        ],
        responses: {
          200: {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HelloResponse: {
        type: 'object',
        required: ['message', 'timestamp'],
        properties: {
          message: {
            type: 'string',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'createdAt'],
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateUserInput: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
          },
          code: {
            type: 'string',
          },
        },
      },
    },
  },
};

const outFile = resolve(__dirname, '../../client/api/openapi/swagger.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(spec, null, 2));
// eslint-disable-next-line no-undef, no-console -- script output for developers
console.log(`OpenAPI spec written to ${outFile}`);
