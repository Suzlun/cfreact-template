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
- Backend: backend package and its single `packages/backend/tsconfig.json`, the
  Resource-first `entry/app/generated/modules/platform/types` elements, Orval
  configuration, the normalization and verification scripts under
  `scripts/codegen/**`, and Drizzle
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
- Server: `entry -> app`; `app -> generated API/Resources | Module entries/Repositories | platform | types`; generated Resource routes -> generated API plus same-Resource generated files and smart Handlers; Handler -> generated API/Types plus same-Resource generated/entry/Service/support; Service -> Types plus same-Resource Repository/Domain/support and other Module public entries; Repository -> same-Resource schema/support plus Platform/Types; Domain -> same-Resource Domain/support plus Types
- Platform is four distinct elements: HTTP, database, email, and observability. Do not treat them as one aggregate dependency target.
- Module-internal relative imports are allowed. Cross-Module relatives, parent escapes, and Module deep imports are prohibited.

### 3. Preserve Enforced Boundaries

- Change TypeSpec first, then run `pnpm gen:api-sdk` and
  `pnpm check:codegen`.
- Never edit generated OpenAPI or SDK output manually.
- Never edit `.opencode/commands/opsx-*.md` or generated
  `.opencode/skills/openspec-*/SKILL.md` files manually; regenerate them with
  `pnpm gen:openspec` from the pinned OpenSpec version.
- Treat generated proposal and apply skills as generic traversal. Apply the
  repository-owned `openspec/proposer` or `openspec/applier` primary-agent
  contract for permissions, dialogue, artifact ownership, and convergence.
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
- Keep generated Resource routes, app composition, Module responsibilities,
  Platform adapters, and shared Types in their declared backend elements.
- `entry` imports `app` only; `app` owns Binding-to-service composition.
- Current Resources are `users`, `hello`, and `health`. Use Handler -> Service -> Repository only where the Resource needs those responsibilities; `hello` and `health` currently stop at the Handler.
- Module public entries are the only cross-Module implementation surface.
- Only `app` may use `@cfreact-template/backend/composition/modules/*`; package exports and shared TypeScript paths never expose that alias or Module internals.
- `packages/backend/src/generated/api/**` is fully generator-owned and exempt from handwritten comment/TSDoc/style rules while boundaries still apply. Orval owns smart-handler preambles; smart-handler bodies remain under normal handwritten implementation, detailed-comment, and TSDoc rules.
- Keep backend external imports within the `boundaries/external` allowlist. Vitest is limited to pure same-Resource test files. Handler and Service code never uses HTTP globals, and Handlers never access `env` directly.
- Keep expected failures in `Result` values and map them to safe `{ code, message }` responses. Wrap generated response validators with `guardResponseValidation`, route unsafe validation details through the logged fixed-500 path, and parse create-user success with the generated schema. Derive duplicate-email 409 responses from the database uniqueness result rather than error-string parsing.
- Keep backend checks in `packages/backend/tsconfig.json`, and keep package exports limited to the Worker, `app`, shared Types, and Resource `index.ts` entries.
- Keep `scripts/codegen/verify-codegen-roots.mjs` before every package generator so real paths remain inside the repository and symbolic links are rejected before writes. Keep `scripts/codegen/normalize-backend-handler-imports.mjs` in the backend generation path. Generated-artifact tracking must use dynamic filesystem enumeration and `git ls-files --cached -z`, accepting staged additions while rejecting untracked artifacts before the drift check.
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
  Scenario IDs. BEHAVIOR and ARCHITECTURE require a Change. BEHAVIOR and
  ARCHITECTURE Changes with delta specs require Scenario IDs; an ARCHITECTURE
  Change with `skip_specs: true` uses a reasoned `なし`.

### 4. Verify Through Real Commands

- Contract/generated changes: `pnpm gen:api-sdk`, then `pnpm check:codegen` for real-path and symbolic-link preflight, Handler import normalization, manifest, dynamically tracked outputs, and drift
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
- Handler-to-Repository imports or Handler access to Context `env`
- Backend external imports outside the element-specific allowlist
- Generated response validation that can expose validator details instead of reaching the logged fixed-500 path
- One-way Playwright E2E-to-Scenario traceability drift
- Collapsing Operation Lane and UX Mode into one classification
- Turning OpenSpec into a file-, helper-, or test-layer implementation plan
