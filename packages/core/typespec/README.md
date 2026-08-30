# Core API contract

`main.tsp` is the source of truth for the private core HTTP contract consumed by app backends through `@cfreact-template/core-sdk`.

- The core Worker is reachable only through a Cloudflare Service Binding.
- Generated OpenAPI and server files are not edited manually.
- `pnpm gen:core` regenerates the core OpenAPI document, Hono routes, smart Handlers, and core SDK.
- Breaking internal changes use a new `/internal/vN` route until all app Workers have migrated.
