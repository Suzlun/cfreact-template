# Repository entrypoints

Read these files before applying `coding-guardian` in this repository.

## Core flow

- `AGENTS.md`: project workflow, required commands, language policy
- `docs/change-operation.md`: authoritative operation lane, UX mode, review depth, and OpenSpec boundary policy
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
- `packages/build-config/react-compiler.js`: shared React Compiler plugins used by frontend and UI Vitest/Vite configs
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

- `packages/backend/package.json`: Workers, Hono, persistence, and layer check scripts
- `packages/backend/tsconfig.*.json`: backend layer-specific TypeScript boundaries

## OpenSpec enforcement

- `.opencode/commands/opsx-*.md` and `.opencode/skills/openspec-*/SKILL.md`: OpenSpec `1.8.0` core definitions generated together by `pnpm gen:openspec`
- `.opencode/skills/openspec/**`: repository-specific supplements layered on the generated core skills
- `openspec/schemas/behavior-change/schema.yaml`: observable behavior Change artifact order and scope
- `openspec/schemas/architecture-change/schema.yaml`: material architecture Change artifact order and scope
- `scripts/openspec/verify-change-proposal.mjs`: resolved proposal structure, request classification, and `UX-Mode` evidence
- `scripts/openspec/verify-scenario-coverage.mjs`: main specs plus active delta application, one-way Playwright E2E-to-Scenario traceability, and `--change` selection
- `scripts/openspec/verify-change-task-scope.mjs`: coarse Work Package and material design scope

## Pull request enforcement

- `.github/pull_request_template.md`: `Operation Lane`, `UX Mode`, `Review Depth`, OpenSpec Change, Scenario IDs, and UI evidence fields
- `.github/workflows/validate-pr-template.yml`: lane vocabulary, OpenSpec requirements, Scenario ID format, checklist completion, production-designer evidence, real-browser confirmation, and desktop/mobile before/after images
- `scripts/release/workflow-policy.test.mjs`: executes the embedded validator against direct, behavior, architecture, and UI evidence cases

## Important reality checks

- There is no `packages/frontend/web`
- There is no `packages/backend/internal`
- There is no Go backend in this repository
- There is no `openapi.gen.go`
- There is no `docs/brand/**` baseline today
