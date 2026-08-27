---
description: Update `CODING_STANDARDS.md` from this repo's actual lint, CI, git-hook, TypeSpec, and test rules with beginner-friendly examples.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding.

## Goal

Update `CODING_STANDARDS.md` so contributors can understand the enforced rules of this repository at a glance, without reading configs first.

This document is lint-as-rules. Include only rules that are mechanically enforceable by the repo's lint commands, CI, tests in the standard flow, or git hooks.

## Hard Constraints

1. Source of truth is the actual enforcement files in this repo. If prose docs disagree with config, scripts, or tests, config, scripts, and tests win.
2. The target file is `CODING_STANDARDS.md`.
3. Do not invent rule IDs.
4. For each enforced rule, include:
   - 1-line summary
   - Enforcement point with command and literal file path
   - One failing example and one compliant example using the target document's established labels
5. Include a `Git hooks` section that describes the exact current behavior:
   - `pre-commit`: `pnpm lint-staged` then `pnpm check:codegen`
   - `commit-msg`: `pnpm commitlint --edit $1`
   - Break down what `.lintstagedrc.json` actually runs for TS, TSX, JS, JSX, JSON, and Markdown
6. Use this repo's actual TypeSpec setup precisely:
   - `packages/typespec/package.json` defines `format`, `format:check`, `gen:openapi`, and `check`
   - OpenAPI output is configured by `packages/typespec/tspconfig.yaml`
7. Mention OpenSpec exactly as implemented today through the `openspec/proposer`-owned confirmed `request.md`, the `behavior-change` and `architecture-change` schemas, `pnpm lint:openspec`, `scripts/openspec/verify-change-proposal.mjs`, `scripts/openspec/verify-scenario-coverage.mjs`, and `scripts/openspec/verify-change-task-scope.mjs`.
8. Use this repo's real file names and paths. Do not reference non-existent legacy paths such as `packages/frontend/web`, `packages/backend/internal/**`, `packages/backend/.golangci.yml`, `tools/scripts/*`, root `.spectral.yaml`, or `commitlint.config.cjs`.
9. Keep OpenSpec documented as the persistent observable Behavior Contract, not a master implementation plan. Document one-way Playwright E2E-to-Scenario traceability, `--change`, coarse Work Packages, and progressive runtime planning.
10. Document the independent `Operation Lane`, `UX Mode`, and `Review Depth` vocabulary enforced by `.github/workflows/validate-pr-template.yml`.
11. Describe the backend exactly as the Resource-first `entry/app/generated/modules/platform/types` structure enforced by the distinct `backend-platform-http`, `backend-platform-database`, `backend-platform-email`, and `backend-platform-observability` elements. Never collapse them into a nonexistent aggregate element.
12. Describe backend code generation exactly: `scripts/codegen/verify-codegen-roots.mjs` resolves real paths and rejects symbolic links before package generators write; Orval output is normalized by `scripts/codegen/normalize-backend-handler-imports.mjs`; `scripts/codegen/verify-backend-handlers.mjs` checks the operation-to-Handler manifest; and `scripts/codegen/verify-generated-artifacts.mjs` dynamically enumerates current artifacts and checks them against `git ls-files --cached -z` before the final drift check.

## Required Structure

`CODING_STANDARDS.md` MUST preserve its current numbered heading text and order:

1. Document status
2. Purpose
3. Project structure
4. Dependency direction
5. Import and export
6. Public API documentation
7. TypeScript
8. Client implementation rules
9. Server implementation rules
10. Size constraints
11. Exceptions
12. Change procedure
13. OpenSpec behavior-contract enforcement
14. Pull request operation metadata

If a section has no enforceable rules beyond a short scope note, keep it brief.

## Execution Steps

1. Read repo context docs:
   - `AGENTS.md`
   - `docs/change-operation.md`
   - `README.md`
   - `CONTRIBUTING.md`
   - `CODING_STANDARDS.md`
2. Read the actual enforcement entrypoints:
   - `package.json`
   - `.github/workflows/ci.yml`
   - `.husky/pre-commit`
   - `.husky/commit-msg`
   - `.lintstagedrc.json`
   - `commitlint.config.js`
   - `eslint.config.js`
   - `packages/typespec/package.json`
   - `packages/typespec/tspconfig.yaml`
   - `packages/typespec/README.md`
   - `packages/backend/package.json`
   - `packages/backend/tsconfig.json`
   - `packages/backend/orval.config.ts`
   - `packages/frontend/orval.config.ts`
   - `scripts/codegen/verify-codegen-roots.mjs`
   - `scripts/codegen/normalize-backend-handler-imports.mjs`
   - `scripts/codegen/verify-backend-handlers.mjs`
   - `scripts/codegen/verify-generated-artifacts.mjs`
   - `openspec/schemas/behavior-change/schema.yaml`
   - `openspec/schemas/architecture-change/schema.yaml`
   - `scripts/openspec/verify-change-proposal.mjs`
   - `scripts/openspec/verify-scenario-coverage.mjs`
   - `scripts/openspec/verify-change-task-scope.mjs`
   - `.github/pull_request_template.md`
   - `.github/workflows/validate-pr-template.yml`
   - `vitest.config.ts`
   - `packages/frontend/vitest.app.config.ts`
   - `packages/ui/vitest.unit.config.ts`
   - `packages/ui/vitest.config.ts`
   - `scripts/release/release-model.test.mjs`
3. Extract only rules that actually fail in this repo, including repo-specific ones such as:
   - TypeSpec is the source of truth; generated OpenAPI, backend API files, smart-Handler preambles, and the frontend SDK are not hand-edited; codegen drift fails.
   - Frontend boundaries such as `app -> domain -> api`, no direct API import from app, no direct `fetch` or `axios`, exported declarations require TSDoc, and hooks must return `{ data, actions }`.
   - Backend boundaries across `entry/app/generated/modules/platform/types`, same-Resource restrictions, Module public entries, the app-only composition alias, and the distinct Platform element types.
   - Backend external-package allowlists, Handler and Service HTTP-global restrictions, and direct Handler `env` access restrictions.
   - Full generator ownership, mixed smart-Handler ownership, package exports, and the single `packages/backend/tsconfig.json` wherever a mechanically enforced rule exists. Do not present implementation-only conventions as lint rules without a failing enforcement point.
   - Handler import normalization, dynamic generated-artifact discovery, staged-file acceptance, untracked-artifact rejection, and final generated drift detection.
   - Exact CI step order and exact git hook behavior.
   - `DIRECT`, `BEHAVIOR`, and `ARCHITECTURE` are independent from `NONE`, `CONTINUITY`, and `SHAPE`; review depth is independently `STANDARD` or `DEEP`.
   - `BEHAVIOR` requires `behavior-change`; `ARCHITECTURE` requires `architecture-change`; `DIRECT` changes neither observable behavior nor material architecture.
   - OpenSpec proposals, one-way Playwright E2E-to-Scenario traceability, coarse Work Package scope, material design scope, and selected-Change `--change` verification.
4. Update `CODING_STANDARDS.md` following the constraints above.
5. Before finishing, sanity-check that every cited rule maps to a real failing command, test, or hook in this repo and that every referenced file path exists.

## Notes

- This command is the canonical way to update `CODING_STANDARDS.md`
- Mention `opencode run --command rules.update-coding-standard` in the document
- Prefer concise explanations over config dumps
