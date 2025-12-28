---
name: cfreact-coding-guardian
description: Enforce the cfreact-template coding constitution by guiding implementation and review to comply with docs/CODING_STANDARDS.md (architecture layers, dependency direction, separation of concerns, import/export conventions, TSDoc, TypeScript safety, React rules, and server clean-architecture rules) and by running local checks (Prettier/ESLint) via bundled scripts. Use when writing, modifying, refactoring, or reviewing code in this repository.
---

# Cfreact Coding Guardian

## Workflow

### 1) Load the rules of the repository

- Read `docs/CODING_STANDARDS.md` and treat it as the constitution.
- Read `CONTRIBUTING.md` for contributor workflow and required checks.
- Treat `eslint.config.js` as “implementation of checks”, not as the source of truth.

### 2) Classify the change before editing

- Identify touched layer(s): `client-app` / `client-domain` / `client-api` / `server-*` / `ui` / `drizzle`.
- Restate the dependency direction you must preserve.
- If the request requires crossing layers, design the boundary first (types/interfaces/DTO mapping) instead of “just importing”.

### 3) Implement while enforcing the constitution

- Place code into the correct layer by responsibility (UI vs hooks vs SDK; HTTP vs usecase vs domain vs persistence).
- Keep dependencies one-way; do not “reach across” to make things easy.
- Use aliases for cross-layer imports; avoid `../` to jump layers.
- Avoid deep imports; expose what you need through the closest `index.ts`.
- Add TSDoc for exported declarations; treat exports as part of the public surface.
- Keep pages/components thin; move logic/state/effects/caching into domain hooks.
- Keep server domain/usecases pure; do not import frameworks/adapters; do not use Web APIs directly.

### 4) Verify locally before finishing

- Run formatting and linting at least for changed files.
- Prefer running the bundled script when the repository has pre-existing lint failures.

Commands:

- Check changed files: `$CODEX_HOME/skills/cfreact-coding-guardian/scripts/check_changed.sh [base]`
- Full-format check: `pnpm format:check`
- Full lint (may fail due to baseline): `pnpm lint`

### 5) Report compliance (for PRs/reviews)

- List the layers you touched and confirm dependency direction stayed valid.
- List any deliberate exceptions (and why they are unavoidable).
- Confirm you ran checks (commands + result summary).

## Common violations to prevent

- Importing `client-api` directly from `client-app`
- Calling `fetch` directly from pages/components/hooks
- Writing state/effects in components, or heavy logic in pages
- Deep-importing internal files instead of using `index.ts`
- Adding exports without TSDoc
- Importing adapters/frameworks/Web APIs from `server-domain` or `server-usecases`
- Accessing `c.env` directly in `server-http`
