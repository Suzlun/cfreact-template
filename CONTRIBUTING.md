# Contributing

プロジェクトへの貢献に感謝します。以下のガイドラインに従ってください。

## 前提環境

- Node.js 24.11+ / pnpm 10.23+（`corepack enable` 推奨）
- Wrangler 4.x
- （任意）Dev Container + Docker

## セットアップ

1. リポジトリをクローンし、依存をインストール
   ```bash
   corepack enable
   pnpm install
   ```
2. 開発サーバー
   ```bash
   pnpm dev:server    # @cfreact-template-server/entry (http://localhost:8787)
   pnpm dev:client    # @cfreact-template-client/app  (http://localhost:5173)
   # または
   pnpm dev:all
   ```

## ブランチとコミット

- ブランチ: `feat/<topic>` / `fix/<topic>` など、main から派生
- コミットメッセージ: Conventional Commits（commitlint + Husky で検証）

## 実装時のチェックリスト

- フォーマット/リント/型
  ```bash
  pnpm format:check
  pnpm lint
  pnpm check
  ```
- テスト
  ```bash
  pnpm test          # すべて（vitest workspace）
  pnpm test:client   # @cfreact-template-client/app
  pnpm test:server   # @cfreact-template-server/http
  pnpm test:ui       # @cfreact-template/ui
  pnpm test:e2e      # Playwright（必要に応じて）
  ```
- API・スキーマの更新
  - API を変更したら OpenAPI と SDK を再生成
    ```bash
    pnpm --filter @cfreact-template-server/entry openapi:gen
    pnpm --filter @cfreact-template-client/api gen
    ```
  - データベーススキーマを変更したらマイグレーションを生成
    ```bash
    pnpm migrate:generate
    ```
    必要に応じて `wrangler d1 execute ...` で適用
- 自動生成ファイル（`packages/client/api/src/generated` など）を手動編集しない

## コーディング規則

- TypeScript: `any`/`unsafe` 系を避け、`import type` を優先。非 null 前提のアクセスをせず、undefined/null を明示的に扱う。
- パス/層: エイリアス（`@cfreact-template-client/*`, `@cfreact-template-server/*`, `@ui/*`, `@drizzle/*` 等）を使用し、eslint の boundaries で定義された依存方向を守る（app→domain→api、entry→app→http/persistence→usecases→domain→types）。
- Hooks: domain 配下の hooks は `useXxx` 命名で `{ data, actions }` を返し、TanStack Query 等の hooks を最低1つ利用。UI 層(app)からの直接参照は禁止。
- API 呼び出し: app から API パッケージを直接 import せず domain hooks 経由。`fetch`/`axios` の直呼びは禁止。
- フロント型変換: API DTO を UI 用型に変換する処理は `packages/client/api` または domain hooks で完結させ、サーバー DTO を UI に漏らさない。
- ファイル命名: domain/hooks 配下は camelCase（`unicorn/filename-case`）。index.ts は re-export 専用（実装禁止）。

## プルリクエストの流れ

1. main を最新化し、作業ブランチを作成
2. コードとテストを追加/更新
3. 上記チェックを通す（少なくとも `pnpm lint` と `pnpm check`、関連テスト）
4. 変更点・動作確認内容を PR に記載し、必要なら README などのドキュメントも更新

不明点があれば Issue/PR で相談してください。
