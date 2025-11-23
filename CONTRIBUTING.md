# Contributing

プロジェクトへの貢献に感謝します。以下のガイドラインに従ってください。

## 前提環境

- Node.js 24.11+ / pnpm 10.22+（`corepack enable` 推奨）
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
   pnpm dev:server    # Workers
   pnpm dev:client    # Vite
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
  pnpm test          # すべて
  pnpm test:client   # フロント
  pnpm test:server   # サーバー
  pnpm test:ui       # UI パッケージ
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
- パス/層: エイリアス（`@client/*`, `@server/*`, `@ui/*` 等）を使い、クリーンアーキテクチャの境界（boundary lint）を守る。hooks 層から UI/pages を直接参照しない。
- Hooks: hooks ディレクトリは `useXxx` で命名し、`{ data, actions }` 形式を返す。TanStack Query などの React/TanStack hooks を最低1つは利用する。
- API 呼び出し: pages/components/hooks から `fetch`/`axios` を直接呼ばず、`@client/api` ラッパー or 用意された hooks 経由で SDK を使う。
- フロント型変換: API DTO を UI 用型に変換する処理は `packages/client/src/api` または hooks で完結させ、サーバー DTO を UI に漏らさない。
- ファイル命名: hooks ディレクトリ配下は camelCase（lint で `unicorn/filename-case`）。他はプロジェクト既存の命名に合わせる。

## プルリクエストの流れ

1. main を最新化し、作業ブランチを作成
2. コードとテストを追加/更新
3. 上記チェックを通す（少なくとも `pnpm lint` と `pnpm check`、関連テスト）
4. 変更点・動作確認内容を PR に記載し、必要なら README などのドキュメントも更新

不明点があれば Issue/PR で相談してください。
