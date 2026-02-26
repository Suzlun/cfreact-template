---
description: Update docs/CODING_STANDARDS.md from lint, CI, and git-hook enforcement for this TypeScript Cloudflare stack.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding if it is not empty.

## Goal

Update `docs/CODING_STANDARDS.md` so humans, including beginners, can understand enforced rules at a glance without reading config files.

This repository is a TypeScript monorepo with React and Vite on the client, Hono on Cloudflare Workers on the server, and a TypeSpec to OpenAPI to SDK generation flow.

The document is **lint-as-rules**. Include **only** rules that are mechanically enforced by lint, CI, and git hooks.

## Hard Constraints (MUST)

1. Source of truth is the lint, CI, and git-hook configuration listed below. Do not invent rules that are not enforceable by those files.
2. Target file is `docs/CODING_STANDARDS.md`. Do not switch to another path.
3. For each enforced rule, include:
   - 1-line summary of required or forbidden behavior
   - Enforcement point with command, config key, and file path
   - Short `NG例` and `OK例`
4. Keep descriptions precise for this stack. Replace outdated wording such as Go-only or Spectral-only rules.
5. Include exact git-hook behavior:
   - pre-commit: `pnpm lint-staged` and `pnpm check:codegen`
   - commit-msg: `pnpm commitlint --edit $1`
   - pre-push: `pnpm lint`
6. Explain fail conditions accurately:
   - `pnpm lint` fails on ESLint errors and OpenSpec checks
   - `pnpm check:codegen` fails when generated artifacts drift
   - CI also runs `pnpm format:check`, `pnpm check`, and `pnpm test:run`
7. Respect generated file policy:
   - `packages/api-contract/openapi/openapi.json` and `packages/client/api/src/generated/client.ts` are generated outputs
   - Regenerate via `pnpm gen:api-sdk`, do not hand-edit generated outputs

## Required Structure (MUST)

`docs/CODING_STANDARDS.md` MUST contain these exact H2 headings in this order:

## 1. 本書の位置付け

## 2. 目的

## 3. プロジェクト構造

## 4. 依存方向

## 5. import / export

## 6. 公開 API のドキュメント

## 7. TypeScript

## 8. クライアント実装規則

## 9. サーバー実装規則

## 10. サイズ制約

## 11. 例外

## 12. 変更手順

## 13. OpenSpec: 仕様を自動テストで担保する

## Execution Steps

1. Read these files:
   - `docs/CODING_STANDARDS.md` current version
   - `package.json`
   - `eslint.config.js`
   - `.eslintrc-maxlines.json`
   - `.prettierrc.json`
   - `tsconfig.base.json`
   - `packages/api-contract/main.tsp`
   - `packages/api-contract/package.json`
   - `packages/api-contract/tspconfig.yaml`
   - `packages/client/api/package.json`
   - `packages/client/api/orval.config.ts`
   - `scripts/openspec/verify-scenario-coverage.mjs`
   - `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`
   - `commitlint.config.js`, `.lintstagedrc.json`
   - `.github/workflows/ci.yml`
2. Extract only mechanically enforced rules from those files.
3. Update `docs/CODING_STANDARDS.md` following all constraints above.
4. Ensure all examples and terminology match this repository stack: TypeScript, React, Hono, Cloudflare Workers, TypeSpec, OpenAPI, OpenSpec.

## Notes

- This command is the canonical way to maintain `docs/CODING_STANDARDS.md`.
- Mention this maintenance command in the operations section of the coding standards document:
  - `opencode run --command rules.update-coding-standard`
