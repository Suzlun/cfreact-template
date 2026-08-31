# Repository entrypoints

Read these files before applying `coding-guardian` in this repository.

## Core flow

- `AGENTS.md`: project workflow, required commands, language policy
- `docs/change-operation.md`: authoritative operation lane, UX mode, review depth, and OpenSpec boundary policy
- `CODING_STANDARDS.md`: mechanically enforced rules summary
- `CONTRIBUTING.md`: contributor workflow and required checks
- `package.json`: root command graph for dev, build, lint, check, codegen, and tests
- `.github/workflows/ci.yml`: default CI order, Playwright browser installation,
  React/shared UI and pure-rule tests, Storybook browser tests, E2E customer
  journeys, and Storybook build

## Git hooks

- `.husky/pre-commit`: `pnpm lint-staged` then `pnpm check:codegen`
- `.husky/commit-msg`: `pnpm commitlint --edit $1`
- `.lintstagedrc.json`: staged-file formatting rules for TS, TSX, JS, JSX, JSON, and Markdown
- `commitlint.config.js`: conventional commit type policy

## Frontend enforcement

- `eslint.config.js`: frontend boundaries for `app` / `domain` / `ui`, direct API import bans, direct fetch bans, TSDoc rules, and hook structure rules
- `apps/main/package.json`: Vite React app, API SDK, domain hook, and shared UI scripts
- `packages/build-config/react-compiler.js`: shared React Compiler plugins used by frontend and UI Vitest/Vite configs
- `apps/main/vitest.frontend.config.ts`: customer-facing React UI rendering and interaction tests
- `packages/ui/vitest.unit.config.ts`: customer-facing shared UI rendering and interaction tests
- `packages/ui/vitest.config.ts`: Storybook browser test projects
- `scripts/eslint/**`: structured inline-disable policy, manual memoization checks, and recurring incompatible-library boundaries
- `apps/main/tsconfig.*.json`: frontend layer-specific TypeScript boundaries
- `packages/ui/styles/globals.css`: design token and global style baseline used by the current app

## Contract enforcement

- `apps/main/package.json` and `packages/core/package.json`: TypeSpec format, compile, generation, and check commands
- `apps/main/typespec/tspconfig.yaml`: OpenAPI emitter output path
- `apps/main/typespec/README.md`: API contract package layout and outputs
- main/core Orval configurations: generated server and SDK inputs and outputs
- `apps/main/typespec/main.tsp` and `packages/core/typespec/main.tsp`: public and internal contract sources of truth
- `packages/core-sdk`: generated server-only client used by app backends

## Backend enforcement

- `apps/main/package.json`: public system Worker, React assets, public Resource generation, and frontend/backend checks
- `packages/core/package.json`: private core Worker, shared domain implementation, D1/email, and internal Resource generation
- `packages/core/vitest.config.ts`: pure deterministic same-Resource backend rule tests
- `packages/core-sdk/src/client.ts` and `client.test.ts`: host-independent URL resolution, authorization overwrite, redirect refusal, and pure transport checks
- `apps/main/tsconfig.backend.json`, `packages/core/tsconfig.json`, and `packages/core-sdk/tsconfig.json`: independent Worker and SDK boundaries
- `scripts/codegen/verify-codegen-roots.mjs`: pre-write real-path containment and symbolic-link rejection for every generated root
- `scripts/codegen/normalize-backend-handler-imports.mjs`: validates each generated Handler Context import shape and normalizes it to a type-only import before formatting
- `scripts/codegen/verify-backend-handlers.mjs`: OpenAPI Resource tag/operation ID to smart-Handler manifest check used by `pnpm check:codegen`
- `scripts/codegen/verify-generated-artifacts.mjs`: dynamically enumerates generated roots and Handler directories, accepts indexed additions from `git ls-files --cached -z`, and rejects untracked artifacts
- `apps/main/src/backend/entry/**`: Workers public entry; imports `app` only
- `apps/main/src/backend/app/**`: public Composition Root that injects the runtime core SDK transport and token into users routes
- `packages/core/src/app/**`: private Composition Root that constructs Service, Repository, D1, and email dependencies
- `apps/main/src/backend/generated/api/**`: fully generator-owned `openapi-typescript` and Orval API files; handwritten comment/TSDoc/style exceptions apply while dependency boundaries remain active
- `apps/main/src/backend/modules/**`: app-owned use cases, direct public users mapping, and local hello/health Resources; app-specific composition belongs in Resource Services
- `packages/core/src/modules/**`: shared-domain operations and queries through core users Service, Repository, schema, support, and smart Handlers; never app workflows or core SDK consumers
- main/core Platform and Types directories: Worker-specific bindings and adapters
- `packages/core/src/modules/users/users.schema.ts`: `users` table ownership; `packages/core/drizzle.config.ts` points here while the existing migration stream remains under `packages/core/drizzle/migrations/**`
- `apps/main/src/backend/platform/http/responseValidation.ts`, generated-response Handler middleware, and `apps/main/src/backend/app/server.ts`: unsafe response-validator details become logged fixed 500 responses; unsafe request-validator details become fixed `INVALID_REQUEST` responses
- `apps/main/src/backend/modules/users/users.responses.ts` and `packages/core/src/modules/users/users.repository.ts`: public response mapping and database-uniqueness handling without error-string parsing
- `eslint.config.js`: `boundaries/elements` capture the Resource name and mechanically enforce direct app mappings, app Service-to-core-SDK composition, core Handler-to-Service-to-Repository-to-schema/Platform direction, same-Resource rules, and distinct HTTP/database/email/observability Platform elements; `no-restricted-imports` prevents core from importing its SDK or apps
- `apps/main/package.json#exports`: public package surface; generated files, Platform adapters, composition-only aliases, Handlers, Repositories, schemas, and other Module internals are not exported

## OpenSpec enforcement

- `.opencode/commands/opsx-*.md` and `.opencode/skills/openspec-*/SKILL.md`: OpenSpec `1.8.0` core definitions generated together by `pnpm gen:openspec`
- `.opencode/agents/openspec/proposer.md` and `.opencode/agents/openspec/applier.md`: user-selected primary-agent ownership and permission boundaries
- `.opencode/skills/openspec/**`: repository-specific planning and review supplements layered on the generated core skills
- `openspec/schemas/behavior-change/schema.yaml`: observable behavior Change artifact order and scope
- `openspec/schemas/architecture-change/schema.yaml`: material architecture Change artifact order and scope
- `scripts/openspec/verify-change-proposal.mjs`: proposal structure and `UX-Mode` evidence
- `scripts/openspec/verify-scenario-coverage.mjs`: main specs plus active delta application, one-way Playwright E2E-to-Scenario traceability, and `--change` selection
- `scripts/openspec/verify-change-task-scope.mjs`: coarse Work Package and material design scope

## Pull request enforcement

- `.github/pull_request_template.md`: `Operation Lane`, `UX Mode`, `Review Depth`, OpenSpec Change, Scenario IDs, and UI evidence fields
- `.github/workflows/validate-pr-template.yml`: lane vocabulary, OpenSpec requirements, Scenario ID format, checklist completion, production-designer evidence, real-browser confirmation, and desktop/mobile before/after images
- `scripts/release/release-model.test.mjs`: pure deterministic release rules included by `pnpm test:run`

## Important reality checks

- There is no `apps/main/web`
- There is no `apps/main/internal`
- There is no Go backend in this repository
- There is no `openapi.gen.go`
- There is no `docs/brand/**` baseline today
