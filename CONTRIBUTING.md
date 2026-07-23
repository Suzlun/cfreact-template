# Contributing

プロジェクトへの貢献に感謝します。レビューと保守をしやすくするため、以下のガイドラインに従ってください。

## ドキュメント

- コーディング規則（一次資料）: `CODING_STANDARDS.md`
  - `eslint.config.js` は規約の自動検査（実装）として追従させます
- 仕様（契約）: `openspec/specs/**/spec.md`
  - `pnpm lint` で `pnpm exec openspec validate --all --strict`、Change Intent 確認ゲート、Scenario ID カバレッジ検査が走ります
  - `openspec/changes/**` の delta spec は、`/opsx-sync` または `/opsx-archive` で main spec に反映してから検査対象になります

## 前提環境

- Node.js 24.12+ / pnpm 11.16.0+（`corepack enable` 推奨）
- Wrangler 4.57.0+
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
3. 手動環境では agent-browser を導入
   ```bash
   sh .devcontainer/scripts/install-agent-browser.sh
   ```

## 依存関係とサプライチェーン対策

- `pnpm-workspace.yaml` の `minimumReleaseAge: 4320` により、npm に公開されてから72時間未満の依存パッケージは解決対象から外します。
- リリースに含める依存追加・更新は、リリース予定日の72時間以上前に完了してください。
- `minimumReleaseAge` の引き下げ、`minimumReleaseAgeExclude` の追加、`--config.minimumReleaseAge=0` のような迂回は行わないでください。
- `allowBuilds` はインストール時スクリプトを許可する明示リストです。新しいパッケージを追加する前に、必要性と公開元を確認してください。
- `dangerouslyAllowAllBuilds` は有効化しないでください。
- agent-browser の state ファイルや認証情報を含むエクスポートファイルはセッショントークンを含む可能性があるため、リポジトリへ追加しないでください。

## ブランチ運用

- 基本: `develop` から作業ブランチを切る
- 命名例: `feat/<topic>` / `fix/<topic>` / `docs/<topic>` / `refactor/<topic>`
- 1PR = 1意図（混ぜすぎない）
- Pull Requestのbaseは`develop`にする
- `develop`向けPull Requestには通常Changesetまたはempty Changesetを1つ追加する
- Release PRの`release -> main`と同期PRの`main -> develop`は自動化に任せる

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
- ESLint 例外は `CODING_STANDARDS.md` の分類に従い、単発なら構造化した `eslint-disable-next-line`、反復する外部 API なら専用境界と import 制約で管理する
- 自動生成ファイルは手で直さない
  - 例: `packages/frontend/src/api/generated/**`
- 仕様が変わる変更は spec とテストをセットで更新する
  - `openspec/specs/**` の `#### Scenario: ... (..-S001)` に対して、テストタイトルに `[...-S001]` を含める
  - 自動化できない Scenario は `Tags: manual` を明示する
- OpenSpec Change は、依頼の意味を repository の事実と照合して所有者が確認した`intent.md`から開始する
  - `Intent-Status: CONFIRMED`と`Owner-Confirmation: CONFIRMED`になる前にproposal以降を作成しない

## React Compiler と Hooks

- frontend と UI の dev、test、build は `@cfreact-template/build-config/react-compiler` の同一設定を使用します。
- domain Hook の `{ data, actions }` 契約は性能都合で分割せず、通常のメモ化は React Compiler に委譲します。
- app pages で使用できる React 組み込み Hook は `useState` だけです。app components では React 組み込み Hook を使用しません。
- domain と UI の Effect はブラウザ API、外部ストア、外部ライブラリとの同期だけに使用します。派生値を state へコピーしません。
- `useMemo`、`useCallback`、`memo` はdomainと手書きUIへ通常の性能目的で追加しません。外部契約が参照同一性を要求する場合だけ、許可リストと構造化理由で例外化します。
- shadcn registry由来で既存の手動メモ化を維持するファイルは `scripts/eslint/disable-policy.mjs` へ集約し、手書きUIを同じ対象外へ暗黙に含めません。
- 同じ非互換 API が繰り返し使われる場合は inline disable を複製せず、`scripts/eslint/disable-policy.mjs` に専用境界を定義します。
- 構造化 inline 例外の必須書式と無効化できないルールは `CODING_STANDARDS.md` を参照してください。

## 共有 UI の再利用

- frontend は `@base-ui/react`、Radix、shadcn、各 widget 実装、`class-variance-authority`、`clsx`、`tailwind-merge` を直接利用せず、`@cfreact-template/ui` の公開 API を利用します。
- app では公開 UI と同名のコンポーネントを再宣言せず、共有 UI を app package から再 export しません。
- 公開 UI を追加するときは、同名の `packages/ui/stories/*.stories.tsx` を追加し、対応する公開 subpath から実 UI を利用します。
- `pnpm lint:ui-reuse` は UI catalog の整合と `packages/ui` / `packages/frontend/src/app` 間のコード clone を検査します。

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

`pnpm lint` には UI 再利用、ESLint、OpenSpec、サプライチェーン設定チェックが含まれます。

必要に応じて関連テストも実行してください。

```bash
pnpm test:run        # すべてのVitest projectとリリース自動化テスト
pnpm test:frontend   # @cfreact-template/frontend
pnpm test:backend    # backend-http Vitest project
pnpm test:ui-package # UI package の Vitest project
pnpm test:e2e        # migration 済み E2E 専用 D1 を使う Playwright
```

## プルリクエストの流れ

1. `develop` を最新化し、作業ブランチを作成
2. 変更・テスト・ドキュメントを追加/更新（必要な範囲で）
3. `pnpm changeset`で通常Changesetを追加する。versionを上げない変更は`pnpm changeset --empty`を使う
4. `pnpm lint` と `pnpm check`、関連テストを通す
5. `develop`向けPRに以下を記載
   - 変更の目的/背景
   - 変更点の要約
   - 動作確認内容（コマンド、確認手順）
   - 破壊的変更がある場合は影響範囲と移行方法

## リリース

- `develop`のCI成功後、通常ChangesetがあればPrepare Release Workflowが`release`とRelease PRを作成または更新します。
- Release PRはmerge commitで`main`へ取り込みます。squash mergeとrebase mergeは使用しません。
- `main`のCI成功後、Release Workflowが`vX.Y.Z`tagとGitHub Releaseを作成します。
- 新しいrelease tagがpushされると、Cloudflare credentialsが設定済みの場合だけDeploy Workflowが本番環境へdeployします。
- リリース後は`sync/main-to-develop` PRが作成され、required checks成功後に自動mergeされます。
- merge済みの`release`と`sync/main-to-develop`はCleanup Release Branches Workflowが自動削除します。
- 生成先repositoryで必要なGitHub App、ruleset、auto-merge、Production Environment設定は`docs/release-operations.md`を参照してください。
- Cloudflare Deploy Button では `https://deploy.workers.cloudflare.com/?url=https://github.com/[アカウント名]/[リポジトリ名]/tree/main` を使用します。
- Deploy Button/Workers Builds は `package.json` の `deploy` script を使い、`pnpm build && wrangler deploy --env production` を実行します。
- Deploy Button/Workers Builds では、`wrangler.toml` の production placeholder を有効な D1 database ID と KV namespace ID に置き換え、必要な R2 bucket を事前に用意します。
- GitHub Actionsの`production` Environmentに`CLOUDFLARE_API_TOKEN`と`CLOUDFLARE_ACCOUNT_ID`がある場合、Deploy WorkflowはD1/KV/R2を名前で作成または再利用し、実ID入りの一時Wrangler設定で直接deployします。未設定の場合もリリース自体は成功します。
- このrepoはrootから `pnpm build` と `wrangler deploy --env production` を実行する前提です。frontend assetsは `packages/frontend/dist`、backend entryは `packages/backend/src/entry/index.ts` です。
- Workers Builds の build variable には `PNPM_VERSION=11.16.0` を設定し、pnpmのバージョン差によるinstall差分を避けてください。
- Cloudflare Email Routing は送信元/送信先の検証が必要なため、Deploy Button後にCloudflare dashboardで設定してください。

不明点があれば Issue/PR で相談してください。
