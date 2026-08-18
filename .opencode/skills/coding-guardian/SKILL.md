---
name: coding-guardian
description: Enforce this repository's real React, Hono, Drizzle, TypeSpec, OpenSpec, and verification rules while editing code, documentation, or tooling.
---

# Coding Guardian

Keep changes aligned with the rules and command paths that actually fail in this
repository.

- Follow `AGENTS.md` for communication language.
- Read `docs/change-operation.md`, `CODING_STANDARDS.md`, and the enforcement
  entrypoints before editing.
- Treat `packages/typespec/main.tsp` as the API contract source of truth.
- Never hand-edit generated artifacts.
- Frontend is React, TSX, Vite, and React Router. Do not introduce assumptions
  about `packages/frontend/web` or SvelteKit.
- Backend is TypeScript, Hono, Cloudflare Workers, and Drizzle. Do not introduce
  Go, Gin, or GORM assumptions.

## Workflow

### 1. Load Repository Rules

Read:

- `AGENTS.md`
- `docs/change-operation.md`
- `CODING_STANDARDS.md`
- `CONTRIBUTING.md`
- `.opencode/skills/coding-guardian/references/repo-entrypoints.md`

Important enforcement entrypoints:

- Root: `package.json`, `.github/workflows/ci.yml`, `.husky/pre-commit`,
  `.husky/commit-msg`, `.lintstagedrc.json`, `commitlint.config.js`,
  `eslint.config.js`
- TypeSpec/codegen: `packages/typespec/package.json`,
  `packages/typespec/tspconfig.yaml`, `packages/typespec/README.md`,
  `packages/frontend/orval.config.ts`
- Frontend: `packages/frontend/package.json`, frontend TypeScript configs,
  `packages/frontend/src/app/**`, `packages/frontend/src/domain/**`,
  `packages/frontend/src/api/**`, `packages/ui/**`
- React Compiler: `packages/build-config/react-compiler.js`, frontend/UI
  Vite/Vitest configs, `scripts/eslint/**`
- Backend: backend package and TypeScript configs, including the independent
  production HTTP boundary in `packages/backend/tsconfig.http.json`, all backend
  layers, and Drizzle
- OpenSpec: generated core commands and skills, both custom schemas, and the
  proposal, Scenario validation, and task scope validators under
  `scripts/openspec/**`
- Pull requests: `.github/pull_request_template.md` and
  `.github/workflows/validate-pr-template.yml`

### 2. Classify Before Editing

- Select `Operation Lane` from `DIRECT | BEHAVIOR | ARCHITECTURE`.
- Select `UX Mode` independently from `NONE | CONTINUITY | SHAPE`.
- Select `Review Depth` independently from `STANDARD | DEEP`.
- `DIRECT` changes neither observable behavior nor material architecture.
- `BEHAVIOR` uses `behavior-change`.
- `ARCHITECTURE` uses `architecture-change`.
- Use `DEEP` for material security, data, external-contract, migration,
  cross-domain architecture, or active-Change interaction risk.

Area mapping:

- Contract/codegen: `packages/typespec/**`, frontend API, Orval config
- Frontend: frontend app/domain and shared UI
- Backend: `packages/backend/**`
- Tooling/workflow: root config, scripts, hooks, CI, `.opencode/**`

Dependency directions:

- Client: `app -> domain -> api` and `app -> ui`
- Server: `entry -> app -> (http | persistence | usecases) -> domain -> types`
- Persistence schema: `persistence -> drizzle`

### 3. Preserve Enforced Boundaries

- Change TypeSpec first, then run `pnpm gen:api-sdk` and
  `pnpm check:codegen`.
- Never edit generated OpenAPI or SDK output manually.
- Never edit `.opencode/commands/opsx-*.md` or
  `.opencode/skills/openspec-*/SKILL.md` manually; regenerate both with
  `pnpm gen:openspec` from the pinned OpenSpec version.
- Never call `fetch`, `axios`, or `cross-fetch` from frontend app/domain code.
- App pages/components import domain hooks, never the API package directly.
- Use the shared React Compiler configuration; runtime source never imports
  build tooling.
- App components use no React built-in hooks. Domain and handwritten UI leave
  ordinary memoization to React Compiler.
- Keep structured one-line ESLint exceptions within the allowlist; isolate
  recurring incompatible APIs behind the declared shared boundary.
- Domain hooks export `use*`, return `{ data, actions }`, and declare `*Data` and
  `*Actions` return types.
- Put reusable presentation in `@cfreact-template/ui` and page composition in
  frontend app.
- Keep HTTP, app wiring, persistence, and domain responsibilities in their
  declared backend layers.
- HTTP never imports persistence directly or reads `c.env` directly.
- Domain and use cases remain framework- and adapter-independent.
- Add required Japanese TSDoc to public package exports, except generated and
  test code.
- OpenSpec persists observable behavior, not a file-level implementation plan.
- Keep `tasks.md` as coarse work packages; decide files, helpers,
  policy-compliant test details, and local order during progressive implementation.
- Allow high-value Playwright E2E journeys, isolated pure deterministic
  customer-impacting rules, customer-facing React UI rendering and interaction
  tests, and Storybook browser tests. React UI tests may use jsdom, MSW, and
  Testing Library when they exercise customer-visible behavior.
- Pure tests never access databases, networks, filesystems, servers, Workerd, or
  other runtimes. Do not create integration, connection, backend HTTP/OpenAPI
  contract, real-database, Workerd-specific, filesystem/child-process tooling
  self-test, or runtime-specific suites.
- Never add production APIs, exports, factories, branches, bindings, or
  configuration solely for test access. Remove the test instead.
- Playwright E2E test titles exclusively own Scenario ID references. Scenarios
  do not require automated test references, and all other tests never reference IDs.
- Validate one Change with
  `node scripts/openspec/verify-scenario-coverage.mjs --change <change-id>`, then
  run the global active-Change check.
- Actual UI changes require a production designer and real desktop/mobile
  browser review. Generated mockups are optional non-contract evidence.
- PRs record Operation Lane, UX Mode, Review Depth, OpenSpec Change, and
  Scenario IDs. BEHAVIOR and ARCHITECTURE require a Change and Scenario IDs.

### 4. Verify Through Real Commands

- Contract/generated changes: `pnpm gen:api-sdk`, `pnpm check:codegen`
- TypeSpec: `pnpm format:check`, `pnpm check`
- JS/TS/TSX: `pnpm lint`, `pnpm test:run`
- Frontend: `pnpm test:frontend`
- Shared UI: `pnpm test:ui-package`
- Storybook browser: `pnpm test:storybook`
- Customer journeys: `pnpm test:e2e`
- Cross-cutting/release-ready: `pnpm build`
- Skill changes: skill validator under `opencode-skills-devkit`
- OpenSpec changes: `pnpm lint:openspec`
- Pure release rules: `pnpm test:release`
- CI gate: install configured Playwright browsers, run `pnpm test:run`,
  `pnpm test:storybook`, and `pnpm test:e2e`, then build Storybook. Do not run
  frontend or shared UI tests separately in CI because `pnpm test:run` already
  contains them.

Changed-file helper:

```bash
.opencode/skills/coding-guardian/scripts/check_changed.sh [base]
```

### 5. Report

Report the touched areas, enforced rules applied, generation performed,
commands and results, and any verification that could not run.

## Prevent These Violations

- Hand-editing generated files
- App-to-API imports or frontend app/domain network calls
- Domain hooks without `{ data, actions }`
- Duplicated React Compiler config or runtime imports of build tooling
- Repeated incompatible APIs outside their declared boundary
- Unsupported ESLint exceptions
- Missing required TSDoc
- HTTP-to-persistence imports or direct `c.env` access
- One-way Playwright E2E-to-Scenario traceability drift
- Collapsing Operation Lane and UX Mode into one classification
- Turning OpenSpec into a file-, helper-, or test-layer implementation plan
