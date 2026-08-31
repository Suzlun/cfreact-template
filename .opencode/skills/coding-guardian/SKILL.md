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
- Treat `apps/main/typespec/main.tsp` and `packages/core/typespec/main.tsp` as the public and internal API contract sources of truth.
- Never hand-edit generated artifacts.
- Frontend is React, TSX, Vite, and React Router. Do not introduce assumptions
  about `apps/main/web` or SvelteKit.
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
- TypeSpec/codegen: both TypeSpec roots, main/core Orval configurations,
  `packages/core-sdk`, and the verification scripts under `scripts/codegen/**`
- Frontend: `apps/main/package.json`, frontend TypeScript configs,
  `apps/main/src/frontend/app/**`, `apps/main/src/frontend/domain/**`,
  `apps/main/src/frontend/api/**`, `packages/ui/**`
- React Compiler: `packages/build-config/react-compiler.js`, frontend/UI
  Vite/Vitest configs, `scripts/eslint/**`
- Backend: `apps/main` and `packages/core`, their independent TypeScript and
  Wrangler configurations, `packages/core-sdk`, and core-owned Drizzle migrations
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
- Repository-template maintenance that preserves the sample application's observable behavior is the documented `DIRECT` exception and creates no OpenSpec Change.
- `BEHAVIOR` uses `behavior-change`.
- `ARCHITECTURE` uses `architecture-change`.
- Use `STANDARD` by default and `DEEP` only under the repository's exact escalation rule.

Area mapping:

- Contract/codegen: both TypeSpec roots, both generated servers, frontend API, and core SDK
- Frontend: frontend app/domain and shared UI
- Backend: `apps/main/src/backend/**`, `packages/core/**`, `packages/core-sdk/**`
- Tooling/workflow: root config, scripts, hooks, CI, `.opencode/**`

Dependency directions:

- Client: `app -> domain -> api` and `app -> ui`
- App server: `entry -> app -> generated Resource -> Handler -> core-sdk` for direct mappings, or `entry -> app -> generated Resource -> Handler -> Service -> core-sdk / declared external client` for app-specific use cases
- Core server: `entry -> app -> generated Resource -> Handler -> Service -> Repository -> schema/Platform`; Service owns domain operations, invariants, transitions, and effect coordination
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
- Apps own use cases identified by intended user, situation, purpose, and outcome. Different intended users define different use cases. When all four match across apps, confirm the app split and preserve it when owner-confirmed; duplication alone never moves a use case into core.
- Core API is the shared domain boundary: expose domain concepts, state, operations, queries, invariants, transitions, and consistency, never app workflows, remote Repository methods, or persistence-shaped DTOs.
- Put app-specific decisions and core/external-service composition in the app Resource Service. Main Services may depend on core SDK; core Services may not. Keep direct Handler-to-core-SDK mappings when no app-specific decision exists.
- App Services may sequence independent domain operations and external services. If a core invariant requires atomic changes, expose one core operation; never reconstruct the transaction in an app.
- Public Resources are `users`, `hello`, and `health`. Public users directly maps core domain operations and queries; core owns the users Service, Repository, schema, D1, email effect, and migrations.
- Module public entries are the only cross-Module implementation surface.
- Only core `app` may use `@cfreact-template/core/composition/modules/*`; app backends use only `@cfreact-template/core-sdk` and never core implementation.
- Main/core generated servers and `packages/core-sdk/src/generated/**` are generator-owned. Orval owns smart-handler preambles; smart-handler bodies remain handwritten.
- Keep backend external imports within the `boundaries/external` allowlist. Vitest is limited to pure same-Resource and core SDK transport test files. Handler and Service code never uses HTTP globals, Handlers never access `env` directly, and core source never imports core SDK.
- Keep the core HTTP contract host-independent and Bearer-authenticated. Construct the core SDK from a runtime base URL, token, and standard `fetch`; Cloudflare Service Binding is only the current transport adapter. Never place the shared token in Wrangler vars, Terraform state, URLs, logs, or caller-controlled headers.
- Keep expected failures in `Result` values and map them to safe `{ code, message }` responses. Wrap generated response validators with `guardResponseValidation`, route unsafe validation details through the logged fixed-500 path, and parse create-user success with the generated schema. Derive duplicate-email 409 responses from the database uniqueness result rather than error-string parsing.
- Keep Worker checks in `apps/main/tsconfig.backend.json` and `packages/core/tsconfig.json`; keep `packages/core-sdk` server-safe and React-free.
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
