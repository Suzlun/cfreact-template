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
- `packages/frontend/package.json`: Vite React app, API SDK, domain hook, and shared UI scripts
- `packages/build-config/react-compiler.js`: shared React Compiler plugins used by frontend and UI Vitest/Vite configs
- `packages/frontend/vitest.app.config.ts`: customer-facing React UI rendering and interaction tests
- `packages/ui/vitest.unit.config.ts`: customer-facing shared UI rendering and interaction tests
- `packages/ui/vitest.config.ts`: Storybook browser test projects
- `scripts/eslint/**`: structured inline-disable policy, manual memoization checks, and recurring incompatible-library boundaries
- `packages/frontend/tsconfig.*.json`: frontend layer-specific TypeScript boundaries
- `packages/ui/styles/globals.css`: design token and global style baseline used by the current app

## Contract enforcement

- `packages/typespec/package.json`: TypeSpec format, compile, and check commands
- `packages/typespec/tspconfig.yaml`: OpenAPI emitter output path
- `packages/typespec/README.md`: API contract package layout and outputs
- `packages/frontend/orval.config.ts`: generated SDK input and output path
- `packages/typespec/main.tsp`: API contract source of truth

## Backend enforcement

- `packages/backend/package.json`: Workers, Hono, Drizzle, Resource generation, the current package exports, and backend typecheck scripts
- `packages/backend/vitest.config.ts`: pure deterministic same-Resource backend rule tests
- `packages/backend/tsconfig.json`: the single backend TypeScript project, private generated/Platform paths, public Module entry paths, and the app-only `@cfreact-template/backend/composition/modules/*` path
- `packages/backend/orval.config.ts`: TypeSpec OpenAPI input and Orval Hono Resource/smart-handler outputs
- `scripts/codegen/verify-codegen-roots.mjs`: pre-write real-path containment and symbolic-link rejection for every generated root
- `scripts/codegen/normalize-backend-handler-imports.mjs`: validates each generated Handler Context import shape and normalizes it to a type-only import before formatting
- `scripts/codegen/verify-backend-handlers.mjs`: OpenAPI Resource tag/operation ID to smart-Handler manifest check used by `pnpm check:codegen`
- `scripts/codegen/verify-generated-artifacts.mjs`: dynamically enumerates generated roots and Handler directories, accepts indexed additions from `git ls-files --cached -z`, and rejects untracked artifacts
- `packages/backend/src/entry/**`: Workers public entry; imports `app` only
- `packages/backend/src/app/**`: Composition Root that composes generated Resources, Module entries/internals, Platform adapters, and shared Types
- `packages/backend/src/generated/api/**`: fully generator-owned `openapi-typescript` and Orval API files; handwritten comment/TSDoc/style exceptions apply while dependency boundaries remain active
- `packages/backend/src/modules/**`: `users`, `hello`, and `health` Resource ownership; smart Handlers mix Orval-owned preambles with developer-owned bodies, and Service/Repository/Domain/schema/support are added only where needed
- `packages/backend/src/platform/**`: Cloudflare/Drizzle/email/observability adapters; may depend only on Platform and shared Types
- `packages/backend/src/types/**`: shared backend Types, including `Result` and the failure logger contract
- `packages/backend/src/modules/users/users.schema.ts`: `users` table ownership; `drizzle.config.ts` points here while the existing migration stream remains under `drizzle/migrations/**`
- `packages/backend/src/platform/http/responseValidation.ts`, generated-response Handler middleware, and `packages/backend/src/app/server.ts`: unsafe response-validator details become logged fixed 500 responses; unsafe request-validator details become fixed `INVALID_REQUEST` responses
- `packages/backend/src/modules/users/users.responses.ts` and `packages/backend/src/modules/users/users.repository.ts`: safe `{ code, message }` responses and database-uniqueness duplicate handling without error-string parsing
- `eslint.config.js`: `boundaries/elements` capture the Resource name and mechanically enforce the entry/app/generated/module/type directions plus distinct HTTP/database/email/observability Platform elements; `boundaries/external` default-denies packages per element; `no-restricted-imports`, global restrictions, and `env` restrictions preserve declared boundaries
- `packages/backend/package.json#exports`: public package surface; generated files, Platform adapters, composition-only aliases, Handlers, Repositories, schemas, and other Module internals are not exported

## OpenSpec enforcement

- `.opencode/commands/opsx-*.md` and `.opencode/skills/openspec-*/SKILL.md`: OpenSpec `1.8.0` core definitions generated together by `pnpm gen:openspec`
- `.opencode/skills/openspec/**`: repository-specific supplements layered on the generated core skills
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

- There is no `packages/frontend/web`
- There is no `packages/backend/internal`
- There is no Go backend in this repository
- There is no `openapi.gen.go`
- There is no `docs/brand/**` baseline today
