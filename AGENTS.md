## Primary Rules

- **MUST think in English** and **MUST communicate in natural Japanese**.
- Every instruction in this file is absolute and binding within its scope. You MUST follow it exactly; if compliance is impossible or instructions conflict, stop and ask the owner instead of proceeding.
- You MUST doubt your assumptions, verify factual claims against available evidence, and MUST NOT present unsupported statements as facts.
- You MUST NOT override a specific rule or prohibition with an inferred benefit, an abstract principle, convenience, consistency, traceability, maintainability, or an unverified safety claim. Only an applicable explicit rule may authorize an exception; if explicit rules conflict or compliance would create a concrete security risk, stop and ask the owner.
- Rules remain binding even when no automated check enforces them. A passing validation proves only the conditions it actually checks and MUST NOT justify an unchecked violation.
- Write `AGENTS.md` in English. Pull request bodies and pull request template content MUST be written in Japanese, except for code identifiers, commands, logs, file paths, and issue or PR references.
- Write all OpenCode agent definitions, skill definitions in `SKILL.md`, and command definitions under `.opencode/` in English. Do not translate their prose into Japanese.

## Natural Japanese Prose

- Any content required to be Japanese MUST read as natural Japanese, not as a literal translation or code-switched prose.
- Do not insert untranslated English common nouns, verbs, adjectives, role names, state names, capability names, or domain terms into Japanese sentences. Use established Japanese words or natural katakana loanwords instead.
- English may remain only when exact spelling is required for correctness: code identifiers, package/API/database identifiers, commands, file paths, log literals, IDs, protocol or standard names, official external product names, and schema-required structural labels.
- A rule that permits "exact technical terms" in English does not widen this exception. "Exact" means a spelling-sensitive proper name or machine-facing token; a generic word such as `Service`, `Customer`, `Account`, `validate`, or `workflow` is not exact merely because software development commonly uses it.
- When an applicable Thesaurus exists, its `Formal Name` is the source of truth for Japanese prose. Its `System Name` is reference metadata and MUST NOT replace the `Formal Name`; mention it only when the exact English name itself is being discussed.
- Wrap exact identifiers in backticks when the format permits and embed them in Japanese grammar instead of using them as untranslated prose vocabulary.
- If no established Japanese term exists, use a natural Japanese description. If the choice can change domain meaning, confirm it with the owner and record it in the Thesaurus before using it in downstream artifacts.
- Apply these rules to user responses, code comments, TSDoc, Japanese repository documentation, OpenSpec prose, pull request bodies, UI copy, and diagram labels.
- Bad: `Service が Customer の Account を validate する。`
- Good: `提供サービスが顧客のアカウントを検証する。`
- Identifier-specific: 提供サービスを表す `Service` 型を検証する。

## Intent Before Implementation

- Treat the user's wording as evidence of intent, not automatically as an implementation-ready specification.
- Before selecting a solution, identify the customer outcome and verify the relevant repository facts and constraints.
- Classify solution-shaped terms as a desired outcome, an outcome constraint, a required means, or a candidate means.
- Confirmation can make a candidate means binding for design, but it never turns a means into an outcome. Only desired outcomes and outcome constraints may become product requirements or OpenSpec Specs; required means remain design constraints.
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
8. YAGNIを徹底し、その精神を極めること。車輪の再発明と不必要に多い実装を欠陥として忌避すること。セキュリティ、サプライチェーン、アーキテクチャのすべての規則が許す限り、まず既存のコードを再利用し、既存のコードで満たせない場合は実績のある外部パッケージを利用すること。独自実装は、既存のコードと外部パッケージのいずれでも検証された顧客成果を満たせないことを確認した場合に限る。

## Code Comments

- Leave detailed Japanese comments for every single process in the code.
- Clarify the intent, input/output, and side effects of each step so that future readers (including yourself) can understand immediately.

## Documentation Comments (TS Docs)

- TSDoc (TypeScript) comments must be written in Japanese, providing detailed, multi-line explanations of their roles and parameter meanings.
- Every public API (functions, methods, types, interfaces, and structs) must have a documentation comment in Japanese that describes what it does, the meaning of each argument and return value, error cases, and usage examples.

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

- Automated tests exist only to protect confirmed customer value by detecting unintended regressions before customers encounter them.
- Only these automated test categories are allowed:
  - Playwright E2E tests exercise high-value customer journeys through public product surfaces. They exclusively own Scenario ID references in titles such as `test('[USER-MGMT-S001] Create a user', async () => { ... })`.
  - Pure unit tests protect deterministic, customer-impacting rules in isolation. They MUST NOT access a database, network, filesystem, server, Workerd, or another runtime, and MUST NOT reference Scenario IDs.
  - React customer-facing UI tests exercise customer-visible rendering and interactions. jsdom, MSW, and Testing Library are allowed when they support that purpose, and these tests MUST NOT reference Scenario IDs.
  - Storybook browser tests protect customer-facing shared UI rendering, interactions, responsive states, themes, and accessibility, and MUST NOT reference Scenario IDs.
- Integration, connection, backend HTTP/OpenAPI contract, real-database, Workerd-specific, filesystem/child-process tooling self-test, and runtime-specific test suites are prohibited. Preserve customer journeys, customer-visible UI, and isolated rules through the allowed categories instead.
- Never add or retain production APIs, exports, factories, branches, bindings, or configuration solely to support tests. Remove the test rather than changing production code for test access.
- Use the fewest tests that preserve the highest-value outcomes. Do not duplicate the same customer assurance across layers or files.
- Retained React/UI and pure rule tests: `pnpm test:run`
- Client UI tests: `pnpm test:frontend`
- Shared UI tests: `pnpm test:ui-package`
- Storybook browser tests: `pnpm test:storybook`
- E2E: `pnpm test:e2e`
- CI installs the configured Playwright browsers, runs `pnpm test:run`, `pnpm test:storybook`, and `pnpm test:e2e`, and builds Storybook. Do not duplicate the frontend or shared UI suites with separate CI invocations because `pnpm test:run` already includes both.

## Pull Requests

- Create work branches from `develop` and target ordinary pull requests to `develop`.
- Pull requests to `develop` that change application release files must add a normal Changeset or an empty Changeset with `pnpm changeset --empty`; template workflow, release tooling, and documentation maintenance must not add pending Changesets.
- Do not run `changeset version` on development branches; release metadata is owned by the `release` automation.
- Always use `.github/pull_request_template.md` when creating a pull request, and fill every template item completely with no blank fields.
- Write the pull request body in Japanese. Code identifiers, commands, logs, file paths, and issue or PR references may remain in their original form.
- Do not delete sections or checklist items that do not apply. Instead, write `なし（理由: ...）` or a concrete reason explaining why the item does not apply.
- Check every checklist item after writing the applicable confirmation or non-applicable reason. Do not leave unchecked items in the pull request body.
- Record `Operation Lane` as `DIRECT`, `BEHAVIOR`, or `ARCHITECTURE`; record `UX Mode` independently as `NONE`, `CONTINUITY`, or `SHAPE`; and record `Review Depth` as `STANDARD` or `DEEP`.
- `BEHAVIOR` and `ARCHITECTURE` pull requests MUST identify an OpenSpec Change and at least one Scenario ID. `DIRECT` pull requests may use a reasoned `なし` for both fields.
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

## Change Operation

- The authoritative change-operation policy is `docs/change-operation.md`.
- Classify every change independently along three axes:
  - `Operation Lane`: `DIRECT`, `BEHAVIOR`, or `ARCHITECTURE`.
  - `UX Mode`: `NONE`, `CONTINUITY`, or `SHAPE`.
  - `Review Depth`: `STANDARD` or `DEEP`.
- `DIRECT` is limited to work that changes neither observable behavior nor material architecture. It does not require an OpenSpec Change.
- `BEHAVIOR` changes observable behavior and MUST use the `behavior-change` schema.
- `ARCHITECTURE` changes material internal structure and MUST use the `architecture-change` schema.
- UX shaping is optional and occurs only under `UX Mode: SHAPE`. `CONTINUITY` preserves an identified existing experience; `NONE` has no user-visible surface change.
- Actual UI changes require production-designer involvement and review in a real browser on desktop and mobile. Generated UI mockups are optional non-contract evidence.
- Use `STANDARD` review by default. Use `DEEP` review for high-impact security, data, external-contract, migration, cross-domain architecture, or active-change interaction risks, or when explicitly requested.

## OpenSpec (Persistent Behavior Contract)

- OpenSpec is the persistent contract for observable behavior, not the master implementation plan.
- OpenSpec is pinned to `1.8.0`. Its `new change` command does not use `openspec/config.yaml#schema` as the creation default, so always pass `--schema behavior-change` for `BEHAVIOR` or `--schema architecture-change` for `ARCHITECTURE`. Never hand-create a directory under `openspec/changes/`.
- OpenCode core definitions under `.opencode/commands/opsx-*.md` and `.opencode/skills/openspec-*/SKILL.md` are generated together from OpenSpec `1.8.0` by `pnpm gen:openspec` and must not be hand-edited. Repository-specific supplemental OpenSpec skills remain under `.opencode/skills/openspec/`.
- Main behavior specs live at `openspec/specs/**/spec.md`; active deltas live under `openspec/changes/*/specs/**/spec.md`.
- Every `#### Scenario:` heading MUST end with a stable Scenario ID such as `(USER-MGMT-S001)`.
- Scenario traceability is one-way: Playwright E2E test titles may reference existing Scenario IDs, but Scenarios do not require automated test references.
- `scripts/openspec/verify-scenario-coverage.mjs` applies active deltas for structural, duplicate-ID, and conflict validation and rejects only Playwright E2E title references to nonexistent Scenario IDs.
- Use `node scripts/openspec/verify-scenario-coverage.mjs --change <change-id>` for one Change and the default all-active-change check for interactions.
- `tasks.md` is a coarse Work Package ledger. Plan file-level, helper-level, and test-level implementation progressively at runtime from the current package and evidence; do not persist a detailed master plan in OpenSpec.
- OpenSpec guardrails run through `pnpm lint:openspec` and include schema validation, strict artifact validation, proposal scope, one-way Playwright E2E-to-Scenario traceability, and task/design scope.
