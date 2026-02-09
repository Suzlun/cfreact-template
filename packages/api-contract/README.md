# API Contract (TypeSpec)

This package is the single source of truth for the API contract.

- Edit entrypoint: `packages/api-contract/main.tsp`
- API base path: `/api/v1` (template convention)
- Generate OpenAPI: `pnpm --filter @cfreact-template/api-contract gen:openapi`
- Output: `packages/api-contract/openapi/openapi.json`

File layout (recommended)

- `packages/api-contract/main.tsp`: service metadata + imports (keep thin)
- `packages/api-contract/src/models/*`: request/response models
- `packages/api-contract/src/routes/v1/*`: versioned routes (v1)
