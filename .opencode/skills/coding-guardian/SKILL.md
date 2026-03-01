---
name: coding-guardian
description: Enforce this repository's coding rules and spec-driven workflow (OpenSpec -> API contract -> generated -> implementation). Use when writing, modifying, refactoring, or reviewing code in this repository.
---

# Coding Guardian

この skill は、実装・レビュー時にこのリポジトリの規約/ワークフローから逸脱しないようにガードします。

- 返答言語: `AGENTS.md` の方針に従う
- 重要: `openspec/**`（要求/合意）と実装が矛盾しないように保つ
- 重要: 生成物は手編集しない（例: `packages/frontend/api/src/generated/**`）
- 重要: lint 回避は禁止（`eslint-disable` 等で逃げずに直す）

## Workflow

### 1) Load the repository rules (before work)

- `AGENTS.md` (project workflow, required commands, boundaries, OpenSpec workflow)
- `openspec/config.yaml` (OpenSpec 設定。change ディレクトリが無い場合もある)
- `CODING_STANDARDS.md` (コーディング規約の一次資料)
- `CONTRIBUTING.md` (contributor workflow / required checks)
- `eslint.config.js` (lint の実装)

### 2) Classify the change (before editing)

- Spec/workflow: `openspec/**` / `.opencode/**`
- Frontend: `packages/frontend/app/**`, `packages/frontend/ui/**`
- Backend: `packages/backend/**`, `packages/backend/drizzle/**`
- Tooling: ルート設定ファイル、CI（存在する場合）

Key dependency directions are fixed (violations fail `pnpm lint`):

- Client: `packages/frontend/app` -> `packages/frontend/domain` -> `packages/frontend/api`
- Server: `packages/backend/entry` -> `packages/backend/app` -> (http/persistence/usecases) -> domain -> types

### 3) Implement without breaking rules

- 生成物（例: `packages/frontend/api/src/generated/**`）は手で直さない
- API 契約/SDK に影響する変更は、必要に応じて `pnpm gen:api-sdk`（swagger 生成 + SDK 再生成）まで通して整合を取る
- 仕様/要件が変わる変更は、OpenSpec を運用している場合は change（例: `openspec/changes/**`）から始める（未初期化ならスキップ）
- Do not bypass ESLint; fix design/boundaries instead
- 依存方向を崩さない（UI->domain->api、entry->app->...）
- Avoid dependency backflow (especially pages <-> domains <-> api)
- 秘密情報はコミットしない（`.env` 等）

### 4) Local verification (before finishing)

Minimum expectations depending on change:

- If API/SDK generation changed: `pnpm gen:api-sdk` の後に `git diff` で生成物が含まれている/不要な差分が無いことを確認
- Required: `pnpm lint`
- If possible: `pnpm test` and `pnpm build`

Lightweight checks for changed files (requires deps installed):

- `.opencode/skills/coding-guardian/scripts/check_changed.sh [base]`

### 5) What to report in reviews/PRs

- 触った領域（OpenSpec / client / server / tooling）と依存方向が保てている根拠
- 生成が必要だったか（`pnpm gen:api-sdk` 等）・実行したか・生成後の差分確認
- Commands you ran (`pnpm lint`, etc.) and key results

## Common violations to prevent

- 生成物（例: `packages/frontend/api/src/generated/**`）の手編集
- 合意済み要件（`openspec/**`）と実装の不整合
- ESLint suppression / bypassing (no inline config)
- `packages/frontend/app` から `packages/frontend/api` を直 import（domain を介さない）
