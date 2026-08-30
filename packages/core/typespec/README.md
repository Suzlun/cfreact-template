# Core API contract

`main.tsp` is the source of truth for the internal core HTTP contract consumed by app backends through `@cfreact-template/core-sdk`.

- Every operation requires the Bearer token declared by the TypeSpec security scheme.
- The SDK receives its base URL, token, and standard `fetch` implementation at runtime.
- Cloudflare uses a Service Binding transport; other runtimes use certificate-validated HTTPS.
- Generated OpenAPI and server files are not edited manually.
- `pnpm gen:core` regenerates the core OpenAPI document, Hono routes, smart Handlers, and core SDK.
- Breaking internal changes use a new `/internal/vN` route until all app Workers have migrated.
