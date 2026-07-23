## Primary Rules

- **MUST Think in English**; **MUST respond in Japanese**; **NEVER NOT use in Other Langages**
- Before calling `task` for any subagent, you MUST read the target agent definition and verify both `permission.task` and any self-call prohibition such as `Do not self-call.`.
- You MUST doubt your assumptions, verify factual claims against available evidence, and MUST NOT present unsupported statements as facts.
- Write `AGENTS.md` in English. Pull request bodies and pull request template content MUST be written in Japanese, except for code identifiers, commands, logs, file paths, and issue or PR references.

## Intent Before Implementation

- Treat the user's wording as evidence of intent, not automatically as an implementation-ready specification.
- Before selecting a solution, identify the customer outcome and verify the relevant repository facts and constraints.
- Classify solution-shaped terms as a required outcome, a non-negotiable constraint, or a candidate means. Do not promote candidate means into requirements without evidence or confirmation.
- Separate observations from inferences and assumptions. Familiarity, common practice, and readily available example code are not evidence that a solution fits this repository.
- Ask the user only when unresolved ambiguity could materially change user-visible behavior, external contracts, architecture, security, data, dependencies, or scope.
- When a workflow provides confirmed intent or an approved specification, preserve that boundary and choose implementation details within it unless contradictory evidence requires escalation.

## Credo

Before beginning any work, you MUST summarize your understanding of the Credo below in Japanese and explicitly declare that you will strictly comply with it. Do not translate or repeat the Credo verbatim; explain how you will apply it to the current task, then begin the work.

1. あらゆる意思決定は顧客ファーストで考えること。誰がどのように利用し、どうすれば喜ばれるかを常に考えること。
2. セキュリティはなによりも優先されること。セキュリティ最優先が、なにより顧客のためになる。
3. 後方互換性は完全悪だ。後方互換性のためのコードや計画がある時点で、そのシステムは一切認められない。常に完璧なプロダクトであるために、不要な機能は即座に削除。
4. 全てのアーキテクチャは保守性のためにある。同じレイヤーの中で同じコードは二度と書くな。コピペはするな。抽象化して考えろ。アーキテクチャで説明できない再実装や再記入は存在してはならない。
5. すべてのルールには意図がある。必ず意図を理解すること。意図を理解しないまま改定したり、逆に遵守しようとしてはならない。
6. 常に完璧なプロダクトであること。妥協、横着、顧客にとって意味のないプロダクトを作ることは一切許されない。仮置きを残す、後回し、コメントにしておいて放置に決してしてはならない。後回しという言葉は発することするら厳禁である。最小実装などという言葉は何があっても使ってはならないし、問題の本質的な解決以外の解決は一切認めない。
7. いかなる理由があろうと、クレドに違反しないこと、クレド違反を放置しないことを最優先とすること。どのクレドによって肯定しうるのか、その作業内容が一切クレドに違反しないことを必ず方針の前に声に出して報告しなければならない。

## Code Comments

- Leave detailed Japanese comments for every single process in the code.
- Clarify the intent, input/output, and side effects of each step so that future readers (including yourself) can understand immediately.

## Documentation Comments (TS Docs)

- TSDoc (TypeScript) comments must be written in Japanese, providing detailed, multi-line explanations of their roles and parameter meanings.
- Every public API (functions, methods, types, interfaces, and structs) must have a documentation comment in Japanese that describes what it does, the meaning of each argument and return value, error cases, and usage examples.

- Think in English; respond in Japanese.

## Commands

- Install: `corepack enable && pnpm install`
- Dev (all): `pnpm dev:all`
- Dev (server): `pnpm dev:backend` (Wrangler on `http://localhost:8787`)
- Dev (client): `pnpm dev:frontend` (Vite on `http://localhost:5173`)
- Browser automation: `agent-browser open http://localhost:5173` and `agent-browser snapshot` (Dev Container installs CLI and Chrome/Chromium)

## API Contract (TypeSpec)

- Source of truth: `packages/typespec/main.tsp`
- Generated OpenAPI: `packages/typespec/openapi/openapi.json`
- Regenerate OpenAPI + client SDK: `pnpm gen:api-sdk`
- Codegen drift check (CI-style): `pnpm check:codegen`

## Testing

- All unit tests: `pnpm test:run`
- Server tests: `pnpm test:backend`
- Client tests: `pnpm test:frontend`
- E2E: `pnpm test:e2e`

## Pull Requests

- Create work branches from `develop` and target ordinary pull requests to `develop`.
- Pull requests to `develop` that change application release files must add a normal Changeset or an empty Changeset with `pnpm changeset --empty`; template workflow, release tooling, and documentation maintenance must not add pending Changesets.
- Do not run `changeset version` on development branches; release metadata is owned by the `release` automation.
- Always use `.github/pull_request_template.md` when creating a pull request, and fill every template item completely with no blank fields.
- Write the pull request body in Japanese. Code identifiers, commands, logs, file paths, and issue or PR references may remain in their original form.
- Do not delete sections or checklist items that do not apply. Instead, write `なし（理由: ...）` or a concrete reason explaining why the item does not apply.
- Check every checklist item after writing the applicable confirmation or non-applicable reason. Do not leave unchecked items in the pull request body.
- For pull requests with UI / UX changes, attach screenshots in all of these sections: `Desktop Before`, `Desktop After`, `Mobile Before`, and `Mobile After`.
- The pull request body is validated by `.github/workflows/validate-pr-template.yml`; when using any pull request creation tool, read the template first and prepare a body that passes this validation.

## Release Automation

- All workspace packages share one application version through the Changesets fixed group; npm publishing is not part of this repository's release.
- `release -> main` and `sync/main-to-develop -> develop` must use merge commits so `main` remains a descendant of released `develop` history.
- The cleanup workflow deletes only merged `release` and `sync/main-to-develop` branches from the same repository; closed unmerged branches must remain available for inspection.
- GitHub Release creation is independent from deployment; the Release workflow explicitly dispatches Cloudflare deployment for a verified `vX.Y.Z` tag when production credentials are configured.
- Raise the minimum release bump by editing only `.release/plan.json` on `release`; do not manually edit generated package versions or changelogs.
- Release automation uses only the repository-scoped `GITHUB_TOKEN`; configure the Actions pull-request permission, branch rulesets, and production environment as documented in `docs/release-operations.md`.

## Supply Chain

- `pnpm-workspace.yaml` enforces `minimumReleaseAge: 4320` (72 hours); do not lower or bypass it.
- Dependency additions/updates must land at least 72 hours before release, unless an explicitly reviewed emergency exception is approved.
- New dependency build scripts require package-by-package approval through `allowBuilds`; never enable `dangerouslyAllowAllBuilds`.
- agent-browser is installed globally in Dev Container via npm and uses Chrome for Testing or OS Chromium depending on platform; do not commit exported browser state or authentication files.

## Architecture Notes

- Client dependency direction: `frontend/src/app -> frontend/src/domain -> frontend/src/api`; shared UI lives in `packages/ui` and is imported as `@cfreact-template/ui`
- Frontend domain is the feature-facing React Hook boundary: each `use*` hook returns the complete `{ data, actions }` contract and hides API, cache, loading, error, and workflow details from app/UI code.
- React Compiler is mandatory for handwritten frontend/domain/UI code and is configured only through `@cfreact-template/build-config/react-compiler`; runtime source must never import build tooling.
- App pages may use `useState` only; app components must not use React built-in Hooks. Domain/UI effects are limited to external-system synchronization.
- Ordinary performance-only `useMemo`, `useCallback`, and `memo` are prohibited in domain and handwritten UI code; upstream registry files listed in `scripts/eslint/disable-policy.mjs` retain their external reference contracts.
- One-off ESLint exceptions use a single structured `eslint-disable-next-line`; recurring incompatible APIs must be isolated behind a reusable boundary declared in `scripts/eslint/disable-policy.mjs`.
- Server dependency direction: `backend/src/entry -> backend/src/app -> (backend/src/http|backend/src/persistence|backend/src/usecases) -> backend/src/domain -> backend/src/types`
- API contract direction: implementation must follow TypeSpec; do not generate OpenAPI from server routes for SDK input.

## OpenSpec (Spec -> Test Contract)

- Source of truth (current behavior): `openspec/specs/**/spec.md`
- Every `#### Scenario:` heading MUST end with a stable Scenario ID: `(...-S001)`
  - Example: `#### Scenario: Create a user (USER-MGMT-S001)`
- Automated tests MUST reference Scenario IDs in the test title using brackets:
  - Example: `it('[USER-MGMT-S001] Create a user', async () => { ... })`
- To explicitly opt out of automation for a scenario, add `Tags: manual` under the scenario heading
- Guardrails are enforced by `pnpm lint`:
  - `pnpm exec openspec validate --all --strict`
  - Scenario ID coverage check (`scripts/openspec/verify-scenario-coverage.mjs`)
  - Coverage check uses `openspec/specs/**` as the contract (sync/archive deltas if you are working in `openspec/changes/**`)
