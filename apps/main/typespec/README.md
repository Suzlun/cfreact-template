# API Contract (TypeSpec)

This package is the single source of truth for the API contract.

- The public contract represents app-owned use cases and outcomes.
- App handlers map core domain operations and queries without exposing the internal core contract directly.

## Routes

- Versioned application routes use the `/api/v1` namespace. The current routes are `/api/v1/hello`, `/api/v1/users`, and `/api/v1/users/{id}`.
- The service health route is `/health` at the server root. It is not versioned under `/api/v1`.

## File Layout

- `apps/main/typespec/main.tsp`: service metadata and imports.
- `apps/main/typespec/src/common/errors.tsp`: shared error models.
- `apps/main/typespec/src/models/health.tsp`: health response model.
- `apps/main/typespec/src/models/hello.tsp`: greeting response model.
- `apps/main/typespec/src/models/user.tsp`: user models and identifiers.
- `apps/main/typespec/src/routes/health.tsp`: root `/health` operation.
- `apps/main/typespec/src/routes/v1/_namespace.tsp`: `/api/v1` namespace definition.
- `apps/main/typespec/src/routes/v1/hello.tsp`: versioned greeting operation.
- `apps/main/typespec/src/routes/v1/users.tsp`: versioned user operations.
- `apps/main/typespec/tspconfig.yaml`: OpenAPI emitter configuration.
- `apps/main/typespec/openapi/openapi.json`: generated OpenAPI output.

## Commands

Run these commands from the repository root:

- `pnpm gen:openapi`: generate and format `apps/main/typespec/openapi/openapi.json`.
- `pnpm --filter @cfreact-template/main check`: check TypeSpec formatting and compile without emitting output.
- `pnpm gen:api-sdk`: generate OpenAPI, backend API files and smart handlers, and the frontend SDK.
- `pnpm check:codegen`: regenerate all API artifacts, verify handler and Git tracking manifests, and reject generated drift.
