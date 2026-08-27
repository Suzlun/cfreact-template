## Primary Rules

- **MUST think in English** and **MUST communicate in natural Japanese**.
- The Credo is the highest project-level decision standard. It governs every agent and every activity, including planning, research, implementation, review, and facilitation.
- Requirements, external contracts, and other repository rules provide facts and constraints subordinate to the Credo. An applicable constraint may reject an in-scope implementation that violates it, but it cannot expand scope or authorize adjacent work. Every action and judgment MUST be permitted by the Credo. If another repository instruction conflicts with the Credo, the Credo prevails.
- You MUST doubt your assumptions and MUST NOT present unsupported statements as facts. Investigate only what is required to make or verify an in-scope judgment.
- A validation proves only the conditions it actually checks. It neither expands the acceptance criteria nor independently authorizes more work.
- Write `AGENTS.md` in English except for the Credo's numbered principles, whose Japanese wording is authoritative. Pull request bodies and pull request template content MUST be written in Japanese, except for code identifiers, commands, logs, file paths, and issue or PR references.
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
- Before selecting a solution, confirm only information whose absence materially changes the customer outcome or scope. Do not repeat questions already answered by the owner or authoritative evidence.
- Classify solution-shaped terms as a desired outcome, an outcome constraint, a required means, or a candidate means.
- Confirmation can make a candidate means binding for design, but it never turns a means into an outcome. Only desired outcomes and outcome constraints may become product requirements or OpenSpec Specs; required means remain design constraints.
- Separate observations from inferences and assumptions. Familiarity, common practice, and readily available example code are not evidence that a solution fits this repository.
- During proposal work, ask one focused owner question for every material artifact-level semantic choice that is not directly entailed by confirmed Request content or authoritative evidence. Do not ask about local implementation choices intentionally left to apply.
- For `BEHAVIOR` and `ARCHITECTURE`, `openspec/proposer` reconstructs a Request candidate in conversation and creates `request.md` only after explicit owner confirmation. Never persist an unconfirmed Request candidate.
- `request.md` is owner-controlled request evidence. Only `openspec/proposer` may create or update it from explicit owner confirmation; reviewers, architects, appliers, and implementation agents must never create, edit, supplement, or reinterpret it.
- Repository evidence, common practice, security recommendations, implementation necessity, downstream artifacts, and tests cannot create product Requirements. Return to the primary agent when the confirmed Request must change.
- When a workflow provides a confirmed Request or an approved specification, preserve that boundary and choose implementation details within it unless contradictory evidence requires escalation.

## Credo

Apply the Credo as a decision standard without reciting it or making ceremonial compliance declarations.

1. 確認済みの顧客成果と外部契約だけを作業範囲の根拠とする。品質、保守性、安全性を理由に、依頼されていない機能や契約を作らない。
2. 顧客成果を完全に満たす、最も小さく一貫した変更を選ぶ。変更ファイル、新しい名前、ブランチ、公開要素を増やさずに済む方法を優先し、隣接箇所をついでに変更しない。
3. 抽象化、モジュール、インターフェース、設定、依存、フォールバック、再試行、防御処理、互換経路、追加試験、追加文書は、確認済み要求を満たすため、または依頼範囲内で再現した障害を直すために不可欠な場合だけ追加する。現在の複数利用箇所は、それだけでは追加理由にしない。
4. 既存コード、標準ライブラリ、実行基盤の標準機能、実績ある外部パッケージを再利用する。未導入であることだけを理由に、実績ある外部パッケージを避けない。独自実装は、これらのいずれでも、妥協すればプロダクトが崩壊しかねないほど中核的な顧客価値を満たせない場合に限る最終手段とする。
5. アーキテクチャは保守性を守り、総複雑性を減らすためにある。定められた責務境界と依存方向は、作業範囲内のすべての実装が必ず守る拘束条件である。違反する実装は受け入れないが、その是正を理由に作業範囲や隣接箇所を広げない。将来の再利用を想定した抽象化や、実装が一つしかないインターフェースを作らない。現在の安定した共通規則を一か所へ置くことで実際に総複雑性が下がる場合だけ抽象化する。
6. 不具合は、観測された原因を最も狭い共有境界で直す。根本原因の追究は、周辺の再設計や未依頼の整理を許可しない。確定範囲内に仮置き、試験専用分岐、黙示的フォールバック、既知の失敗を残さない。
7. 廃止された挙動を可能性だけで維持しない。永続データ、提供済みの外部契約、明示された要求は現在の制約として扱う。完了判定を満たしたら作業を終了する。

## Code Comments

- Add Japanese comments only when they convey non-obvious intent, constraints, inputs or outputs, or side effects. Do not comment every process or restate the code.

## Documentation Comments (TS Docs)

- Handwritten exported TypeScript declarations must have Japanese TSDoc where lint requires it.
- Keep TSDoc limited to contract information that names and types do not already express. Do not invent error cases or examples, and do not repeat the signature in prose.

## Commands

- Install: `corepack enable && pnpm install`
- Dev (all): `pnpm dev:all`
- Dev (server): `pnpm dev:backend` (Wrangler on `http://localhost:8787`)
- Dev (client): `pnpm dev:frontend` (Vite on `http://localhost:5173`)
- Browser automation: `agent-browser open http://localhost:5173` and `agent-browser snapshot` (Dev Container installs CLI and Chrome/Chromium)

## API Contract (TypeSpec)

- Source of truth: `packages/typespec/main.tsp`
- Generated OpenAPI: `packages/typespec/openapi/openapi.json`
- Regenerate OpenAPI + backend API + frontend SDK: `pnpm gen:api-sdk`
- Codegen drift and backend Handler manifest check (CI-style): `pnpm check:codegen`

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
- `BEHAVIOR` and `ARCHITECTURE` pull requests MUST identify an OpenSpec Change. `BEHAVIOR` and `ARCHITECTURE` Changes with delta specs MUST identify at least one Scenario ID; `DIRECT` and `ARCHITECTURE` Changes with `skip_specs: true` may use a reasoned `なし` for Scenario IDs.
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

- The architecture and dependency-direction rules below are binding constraints on every in-scope implementation. They may reject a nonconforming implementation, but they never expand scope or authorize adjacent work.
- Client dependency direction: `frontend/src/app -> frontend/src/domain -> frontend/src/api`; shared UI lives in `packages/ui` and is imported as `@cfreact-template/ui`
- Frontend domain is the feature-facing React Hook boundary: each `use*` hook returns the complete `{ data, actions }` contract and hides API, cache, loading, error, and workflow details from app/UI code.
- React Compiler is mandatory for handwritten frontend/domain/UI code and is configured only through `@cfreact-template/build-config/react-compiler`; runtime source must never import build tooling.
- App pages may use `useState` only; app components must not use React built-in Hooks. Domain/UI effects are limited to external-system synchronization.
- Ordinary performance-only `useMemo`, `useCallback`, and `memo` are prohibited in domain and handwritten UI code; upstream registry files listed in `scripts/eslint/disable-policy.mjs` retain their external reference contracts.
- One-off ESLint exceptions use a single structured `eslint-disable-next-line`; recurring incompatible APIs must be isolated behind a reusable boundary declared in `scripts/eslint/disable-policy.mjs`.
- Server dependency direction: `backend/src/entry -> backend/src/app`; `app` composes generated Resource routes, Module public entries or Repositories reached only through `@cfreact-template/backend/composition/modules/*`, Platform adapters, and shared Types. Generated Resource routes may reference shared generated API types, their same-Resource generated files, and smart Handlers. A Handler may use shared generated API types and Types plus its same-Resource generated files, public entry, Service, or support; a Service may use shared Types, its same-Resource Repository, Domain, or support, plus another Resource's public entry; a Repository may use its same-Resource schema or support plus Platform and shared Types; a Domain may use same-Resource Domain or support plus shared Types. Module-internal relative imports are allowed, but cross-Module relatives and parent escapes are not, except for generator-owned smart-handler preambles that reach the same Resource's generated files.
- Current server Resources are `users`, `hello`, and `health`. `users` uses Handler -> Service -> Repository and owns its Drizzle schema; `hello` and `health` stop at their Handlers because they need no Service or Repository.
- Backend external-package imports are denied by default. The allowlist is limited to Hono in app/Handlers/HTTP Platform, generated Hono validation dependencies, ULID in Services, Drizzle in Repositories/schemas/database Platform, `cloudflare:email` in email Platform, Workers types in shared Types, and Vitest in pure same-Resource test files. Handler and Service code must not bypass declared dependencies through HTTP globals; Handlers must not read `env` directly.
- `packages/backend/src/generated/api/**` is fully owned by `openapi-typescript` and Orval, so generated files are exempt from handwritten comment, TSDoc, type-safety, and formatting rules while dependency boundaries remain enforced. Smart Handlers are mixed-ownership files: Orval owns the preamble and developers own the body, which remains subject to the applicable concise comment and TSDoc rules.
- Backend package exports expose only the Worker entry, app entry, shared Types entry, and each Resource's `index.ts`; they never expose generated files, Platform adapters, composition aliases, Handlers, Repositories, or schemas.
- Expected failures cross backend boundaries as `Result` values and become safe `{ code, message }` responses. Generated response validators are wrapped by `guardResponseValidation`; unsafe validation details become exceptions that `app.onError` logs before returning the fixed 500 response. The create-user success payload is parsed with its generated schema. Duplicate user email is detected by the database uniqueness outcome and becomes 409 without parsing database error text.
- The backend uses only `packages/backend/tsconfig.json`; `pnpm check` reaches its `tsc --noEmit` check. Every package-level API generator runs `scripts/codegen/verify-codegen-roots.mjs` first to resolve real paths and reject symbolic links throughout generated roots before any write. Backend generation normalizes Orval Context imports with `scripts/codegen/normalize-backend-handler-imports.mjs` before formatting. `pnpm check:codegen` regenerates all API artifacts, verifies the OpenAPI operation-to-Handler manifest, dynamically enumerates generated files and Handler directories, accepts staged additions reported by `git ls-files --cached -z`, rejects untracked artifacts, and rejects generated drift.
- API contract direction: implementation follows `packages/typespec/main.tsp`; `pnpm gen:api-sdk` generates the OpenAPI document, backend `openapi-typescript` types, Orval Hono Resource routes and smart Handlers, and the frontend SDK. Never generate SDK input from server routes or hand-edit generated output.

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
- Use `STANDARD` review by default. Use `DEEP` only when explicitly requested or when one exact unresolved question indispensable to a confirmed customer outcome or external contract cannot be resolved by `STANDARD`. A risk category alone does not justify extra review work.

## OpenSpec (Persistent Behavior Contract)

- OpenSpec is the persistent contract for observable behavior, not the master implementation plan.
- OpenSpec is pinned to `1.8.0`. Its `new change` command does not use `openspec/config.yaml#schema` as the creation default, so always pass `--schema behavior-change` for `BEHAVIOR` or `--schema architecture-change` for `ARCHITECTURE`. Never hand-create a directory under `openspec/changes/`.
- OpenCode core definitions under `.opencode/commands/opsx-*.md` and `.opencode/skills/openspec-*/SKILL.md` are generated together from OpenSpec `1.8.0` by `pnpm gen:openspec` and must not be hand-edited. Repository-specific supplemental OpenSpec skills remain under `.opencode/skills/openspec/`.
- The user selects `openspec/proposer` for owner dialogue and planning, and selects `openspec/applier` for implementation. Both are primary agents and must never be invoked through subagent delegation.
- The generated `openspec-propose` and `openspec-apply-change` skills supply generic OpenSpec traversal. The corresponding primary agent applies the repository-owned workflow, permissions, and semantic boundaries.
- Both Change schemas begin with a primary-agent-owned `Request-Status: CONFIRMED` `request.md`. Before asking for a concrete solution, the primary agent MUST ensure that who is affected, the current situation, the motivation for change, the expected value, and the desired outcome are confirmed. Ask only for missing material information and do not repeat confirmed questions. Confirmed Background and Motivation sections explain the Request but never create product Requirements by themselves.
- `openspec/proposer` owns all planning artifacts and never delegates owner questions or artifact authorship.
- During artifact work, the primary agent MUST ask one focused owner question for every material non-self-evident semantic choice instead of inferring or completing it. An unambiguous answer that states background, motivation or expected value, an outcome, an outcome constraint, or required means MUST be added immediately to `request.md` with that answer as confirmation evidence.
- Solution-shaped input MUST be traced to its background, motivation, and desired outcome before the named solution can be recorded as a required means.
- Request content MUST be routed by artifact meaning: Specs contain only positive observable customer value and externally owned constraints, design contains material means and architecture decisions, and tasks remain coarse Work Packages. Request wording never overrides an artifact's format or semantic boundary.
- An `architecture-change` that changes no observable behavior MUST set `skip_specs: true` in `.openspec.yaml` and MUST NOT invent delta Specs, Requirements, Scenarios, Spec Units, or corresponding reuse-research rows. Remove `skip_specs` and author delta Specs only when the confirmed Request changes observable behavior.
- Request candidates remain in conversation until owner confirmation. Contract artifacts contain only owner-confirmed positive outcomes and constraints; they omit non-goals, rejected alternatives, absent legacy behavior, absent implementation, and technologies or features that will not be added.
- Remove obsolete behavior with `REMOVED Requirements`; never replace unrequested or removed behavior with an inverse Requirement that requires its absence.
- Main behavior specs live at `openspec/specs/**/spec.md`; active deltas live under `openspec/changes/*/specs/**/spec.md`.
- Every `#### Scenario:` heading MUST end with a stable Scenario ID such as `(USER-MGMT-S001)`.
- Scenario traceability is one-way: Playwright E2E test titles may reference existing Scenario IDs, but Scenarios do not require automated test references.
- `scripts/openspec/verify-scenario-coverage.mjs` applies active deltas for structural, duplicate-ID, and conflict validation and rejects only Playwright E2E title references to nonexistent Scenario IDs.
- Use `node scripts/openspec/verify-scenario-coverage.mjs --change <change-id>` for one Change and the default all-active-change check for interactions.
- `tasks.md` is a coarse Work Package ledger. Plan file-level, helper-level, and test-level implementation progressively at runtime from the current package and evidence; do not persist a detailed master plan in OpenSpec.
- Every `architecture-change` delta Spec Unit must have one or more capability-level `Reuse Assessment` decisions in `design.md`, including the reuse source classification, adoption decision, selected target and version, and a current research report whose investigation scope explicitly covers that capability. Requirement traceability is not package-candidate coverage, and transitive resolution is not direct adoption.
- OpenSpec guardrails run through `pnpm lint:openspec` and include schema validation, strict artifact validation, proposal scope, one-way Playwright E2E-to-Scenario traceability, and task/design scope.
