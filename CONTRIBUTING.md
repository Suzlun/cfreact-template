# Contributing

プロジェクトへの貢献に感謝します。レビューと保守をしやすくするため、以下のガイドラインに従ってください。

## ドキュメント

- コーディング規則（一次資料）: `CODING_STANDARDS.md`
  - `eslint.config.js` は規約の自動検査（実装）として追従させます
- 仕様（契約）: `openspec/specs/**/spec.md`
  - `pnpm lint` で `openspec validate --all --strict` と Scenario ID カバレッジ検査が走ります
  - `openspec/changes/**` の delta spec は、`/opsx-sync` または `openspec archive` で main spec に反映してから検査対象になります

## 前提環境

- Node.js 24.12+ / pnpm 11.7.0+（`corepack enable` 推奨）
- Wrangler 4.57.0+
- Sentrux CLI（`pnpm lint` に含まれる構造品質ゲート用。Dev Container では自動導入）
- agent-browser CLI（ブラウザ自動操作用。Dev Container では Chrome for Testing または OS Chromium とあわせて自動導入）
- （任意）Dev Container + Docker（推奨）

## セットアップ

1. リポジトリをクローンし、依存をインストール
   ```bash
   corepack enable
   pnpm install
   ```
2. 開発サーバー
   ```bash
   pnpm dev:backend    # @cfreact-template/backend (http://localhost:8787)
   pnpm dev:frontend    # @cfreact-template/frontend  (http://localhost:5173)
   # または
   pnpm dev:all
   ```
3. 手動環境では Sentrux を導入
   ```bash
   sh .devcontainer/scripts/install-sentrux.sh
   ```
4. 手動環境では agent-browser を導入
   ```bash
   sh .devcontainer/scripts/install-agent-browser.sh
   ```

## 依存関係とサプライチェーン対策

- `pnpm-workspace.yaml` の `minimumReleaseAge: 4320` により、npm に公開されてから72時間未満の依存パッケージは解決対象から外します。
- リリースに含める依存追加・更新は、リリース予定日の72時間以上前に完了してください。
- `minimumReleaseAge` の引き下げ、`minimumReleaseAgeExclude` の追加、`--config.minimumReleaseAge=0` のような迂回は行わないでください。
- `allowBuilds` はインストール時スクリプトを許可する明示リストです。新しいパッケージを追加する前に、必要性と公開元を確認してください。
- `dangerouslyAllowAllBuilds` は有効化しないでください。
- Sentrux は GitHub Releases latest から導入します。`.devcontainer/scripts/install-sentrux.sh` の sha256 digest 検証を外したり、未検証の `curl | sh` に置き換えたりしないでください。
- agent-browser の state ファイルや認証情報を含むエクスポートファイルはセッショントークンを含む可能性があるため、リポジトリへ追加しないでください。

## ブランチ運用

- 基本: `develop` から作業ブランチを切る
- 命名例: `feat/<topic>` / `fix/<topic>` / `docs/<topic>` / `refactor/<topic>`
- 1PR = 1意図（混ぜすぎない）

## コミット

Husky によりコミット時に検証されます。

- `commit-msg`: `pnpm commitlint --edit $1`
- `pre-commit`: `pnpm lint-staged`

コミットメッセージは Conventional Commits に従ってください（`commitlint.config.js`）。

例:

- `feat(client): add user profile page`
- `fix(server): prevent null env injection`
- `docs: update coding standards`

## 変更を入れるときの原則

- まず `CODING_STANDARDS.md` の意図（層の責務・依存方向）に沿って配置する
- “例外” は最小にする（ESLint disable コメントは禁止。必要な例外は対象を限定した設定で理由を明示する）
- 自動生成ファイルは手で直さない
  - 例: `packages/frontend/src/api/generated/**`
- 仕様が変わる変更は spec とテストをセットで更新する
  - `openspec/specs/**` の `#### Scenario: ... (..-S001)` に対して、テストタイトルに `[...-S001]` を含める
  - 自動化できない Scenario は `Tags: manual` を明示する

## 自動生成

### API

API 契約 (TypeSpec) を変更したら、OpenAPI と SDK を再生成してください。

```bash
pnpm gen:api-sdk
```

### DB

スキーマを変更したらマイグレーションを生成してください。

```bash
pnpm migrate:generate
```

適用は `wrangler d1 execute ...`（README 参照）。

## 実装時のチェック

PR 前にローカルで以下を通してください。

```bash
pnpm format:check
pnpm lint
pnpm check
```

`pnpm lint` には `sentrux check packages` が含まれます。Sentrux は `.opencode/skills/**`、ルート設定、運用 scripts ではなく、`packages/` 配下のアプリ本体を対象にします。AI エージェントで大きめの変更を行う場合は、作業前に `pnpm sentrux:gate:save`、作業後に `pnpm sentrux:gate` を実行して構造劣化を検出してください。

必要に応じて関連テストも実行してください。

```bash
pnpm test          # すべて（vitest workspace）
pnpm test:frontend   # @cfreact-template/frontend
pnpm test:backend   # backend-http Vitest project
pnpm test:ui       # Vitest UI
pnpm test:e2e      # Playwright（変更が e2e に影響する場合）
```

## プルリクエストの流れ

1. `main` を最新化し、作業ブランチを作成
2. 変更・テスト・ドキュメントを追加/更新（必要な範囲で）
3. `pnpm lint` と `pnpm check`、関連テストを通す
4. PR に以下を記載
   - 変更の目的/背景
   - 変更点の要約
   - 動作確認内容（コマンド、確認手順）
   - 破壊的変更がある場合は影響範囲と移行方法

不明点があれば Issue/PR で相談してください。
