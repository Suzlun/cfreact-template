---
description: Update CODING_STANDARD.md from SNiX lint/CI/git-hooks rules with beginner-friendly NG/OK examples (no invented rules).
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Update `CODING_STANDARD.md` so humans (including beginners) can understand the enforced rules at a glance, **without reading configs**.

This document is **lint-as-rules**: include **only** rules that are mechanically enforceable by lint/CI/git hooks.

## Hard Constraints (MUST)

1. Source of truth is the **lint/CI/git hooks configuration** listed below. Do not invent rules that are not enforceable by these files.
2. Do NOT invent rule IDs. If `CODING_STANDARD.md` already uses IDs like `POL-001`, keep existing ones, but do not add new IDs.
3. For each enforced rule, include:
   - 1-line summary (required/forbidden)
   - Enforcement point: command + config key + file path (literal)
   - `NG例` and `OK例` (short; path/import/comment examples)
4. Include `Git hooks` section describing what runs on:
   - pre-commit (`lint-staged` and generated check)
   - commit-msg (`commitlint`)
   - pre-push (`pnpm lint`)
5. Spectral behavior must be precise:
   - CI fails only on `spectral lint --fail-severity error` (warnings do not fail).

## Required Structure (MUST)

`CODING_STANDARD.md` MUST contain these headings (exact H2, in order):

## 0. 全体方針

## 1. リポジトリ共通（POL）

## 2. リポジトリ構造（STRUCT）

## 3. 仕様と生成（SPEC & GEN）

## 4. TypeSpec（TSP）

## 5. OpenAPI（OAS）

## 6. フロントエンド（TS/React）

## 7. バックエンド（Go）

## 8. CI 必須ステップ（CI）

## 9. ルールのメンテ運用（OPS）

## 10. 付録（要点）

## 11. Git hooks

## 12. 設定参照

## Execution Steps

1. Read these files:
   - `CODING_STANDARD.md` (current)
   - `tools/scripts/lint.mjs`
   - `tools/scripts/lint-structure.mjs`
   - `eslint.config.mjs`
   - `.spectral.yaml`
   - `tools/scripts/lint-openapi.mjs`
   - `.golangci.yml`
   - `tools/scripts/lint-go-policy.mjs`
   - `tools/scripts/lint-go-vuln.mjs`
   - `tools/scripts/lint-secrets.mjs`
   - `tools/scripts/lint-vuln-osv.mjs`
   - `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`
   - `commitlint.config.cjs`, `.lintstagedrc.cjs`
   - `.github/workflows/ci.yml`
2. Update `CODING_STANDARD.md` following the constraints above.

## Notes

- This command is the canonical way to update `CODING_STANDARD.md`. Mention this under `OPS-001`:
  - `opencode run --command rules.update-coding-standard`
