## Primary Rules

- Think in English; respond in Japanese.

## Commands

- Install: `corepack enable && pnpm install`
- Dev (all): `pnpm dev:all`
- Dev (server): `pnpm dev:server` (Wrangler on `http://localhost:8787`)
- Dev (client): `pnpm dev:client` (Vite on `http://localhost:5173`)

## API Contract (TypeSpec)

- Source of truth: `packages/api-contract/main.tsp`
- Generated OpenAPI: `packages/api-contract/openapi/openapi.json`
- Regenerate OpenAPI + client SDK: `pnpm gen:api-sdk`
- Codegen drift check (CI-style): `pnpm check:codegen`

## Testing

- All unit tests: `pnpm test:run`
- Server tests: `pnpm test:server`
- Client tests: `pnpm test:client`
- E2E: `pnpm test:e2e`

## Architecture Notes

- Client dependency direction: `client/app -> client/domain -> client/api`
- Server dependency direction: `server/entry -> server/app -> (server/http|server/persistence|server/usecases) -> server/domain -> server/types`
- API contract direction: implementation must follow TypeSpec; do not generate OpenAPI from server routes for SDK input.
