# Repository entrypoints

Read these files before applying `coding-guardian` in this repository.

## Core flow

- `AGENTS.md`: project workflow, required commands, language policy
- `CODING_STANDARDS.md`: mechanically enforced rules summary
- `CONTRIBUTING.md`: contributor workflow and required checks
- `package.json`: root command graph for dev, build, lint, check, codegen, and tests
- `.github/workflows/ci.yml`: default CI order

## Git hooks

- `.husky/pre-commit`: `pnpm lint-staged` then `pnpm check:codegen`
- `.husky/commit-msg`: `pnpm commitlint --edit $1`
- `.lintstagedrc.json`: staged-file formatting rules for TS, TSX, JS, JSX, JSON, and Markdown
- `commitlint.config.js`: conventional commit type policy

## Frontend enforcement

- `eslint.config.js`: frontend boundaries for `app` / `domain` / `ui`, direct API import bans, direct fetch bans, TSDoc rules, and hook structure rules
- `packages/frontend/package.json`: Vite React app, API SDK, domain hook, and shared UI scripts
- `packages/frontend/tsconfig.*.json`: frontend layer-specific TypeScript boundaries
- `packages/frontend/src/ui/styles/globals.css`: design token and global style baseline used by the current app

## Contract enforcement

- `packages/typespec/package.json`: TypeSpec format, compile, and check commands
- `packages/typespec/tspconfig.yaml`: OpenAPI emitter output path
- `packages/typespec/README.md`: API contract package layout and outputs
- `packages/frontend/orval.config.ts`: generated SDK input and output path
- `packages/typespec/main.tsp`: API contract source of truth

## Backend enforcement

- `packages/backend/package.json`: Workers, Hono, persistence, and layer check scripts
- `packages/backend/tsconfig.*.json`: backend layer-specific TypeScript boundaries
- `packages/backend/src/http/contracts/openapi-contract.test.ts`: server OpenAPI must match TypeSpec-generated OpenAPI

## OpenSpec enforcement

- `scripts/openspec/verify-scenario-coverage.mjs`: Scenario ID coverage checks used by `pnpm lint`

## Important reality checks

- There is no `packages/frontend/web`
- There is no `packages/backend/internal`
- There is no Go backend in this repository
- There is no `openapi.gen.go`
- There is no `docs/brand/**` baseline today
