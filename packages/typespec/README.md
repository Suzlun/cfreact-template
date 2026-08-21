# API Contract (TypeSpec)

This package is the single source of truth for the API contract.

## Routes

- Versioned application routes use the `/api/v1` namespace. The current routes are `/api/v1/hello`, `/api/v1/users`, and `/api/v1/users/{id}`.
- The service health route is `/health` at the server root. It is not versioned under `/api/v1`.

## File Layout

- `packages/typespec/main.tsp`: service metadata and imports.
- `packages/typespec/src/common/errors.tsp`: shared error models.
- `packages/typespec/src/models/health.tsp`: health response model.
- `packages/typespec/src/models/hello.tsp`: greeting response model.
- `packages/typespec/src/models/user.tsp`: user models and identifiers.
- `packages/typespec/src/routes/health.tsp`: root `/health` operation.
- `packages/typespec/src/routes/v1/_namespace.tsp`: `/api/v1` namespace definition.
- `packages/typespec/src/routes/v1/hello.tsp`: versioned greeting operation.
- `packages/typespec/src/routes/v1/users.tsp`: versioned user operations.
- `packages/typespec/tspconfig.yaml`: OpenAPI emitter configuration.
- `packages/typespec/openapi/openapi.json`: generated OpenAPI output.

## Commands

Run these commands from the repository root:

- `pnpm gen:openapi`: generate and format `packages/typespec/openapi/openapi.json`.
- `pnpm --filter @cfreact-template/typespec check`: check TypeSpec formatting and compile without emitting output.
- `pnpm gen:api-sdk`: generate OpenAPI, backend API files and smart handlers, and the frontend SDK.
- `pnpm check:codegen`: regenerate all API artifacts, verify handler and Git tracking manifests, and reject generated drift.
