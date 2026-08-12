# Contributing

プロジェクトへの貢献に感謝します。レビューと保守をしやすくするため、以下のガイドラインに従ってください。

## ドキュメント

- コーディング規則（一次資料）: `CODING_STANDARDS.md`
  - `eslint.config.js` は規約の自動検査（実装）として追従させます
- 変更運用（一次資料）: `docs/change-operation.md`
- 永続的な振る舞い契約: `openspec/specs/**/spec.md`
  - `pnpm lint` で変更スキーマ、提案、厳格な成果物形式、Scenario と試験の追跡、作業パッケージと設計の対象範囲を検査します
  - 活動中差分は同期前から構造、識別子、競合を検査し、計画時は主仕様の試験参照だけを必須とします

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
- `packages/**`、`drizzle/**`、root manifest、lockfile、Wrangler設定を変更する`develop`向けPull Requestには通常Changesetまたはempty Changesetを1つ追加する
- template workflow、release tooling、文書だけの保守では、生成先へpending releaseを持ち込むChangesetを追加しない
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
- 振る舞い契約が変わる変更は仕様と試験を一緒に更新する
  - 主仕様の自動化対象 Scenario と、実装を完了する活動中差分の Scenario に対して、試験タイトルに `[...-S001]` を含める
  - 自動化できない Scenario は `Tags: manual` を明示する
- OpenSpec Change の `proposal.md` は、依頼を成果、成果の制約、必須手段、候補手段へ分類し、リポジトリの事実と照合した権威ある解釈とする
  - 重要な曖昧さが残る間は `Intent-Resolution: DRAFT` とし、差分仕様、設計、作業パッケージを作成しない

## 変更運用

変更を始める前に、`docs/change-operation.md` に従って三軸を独立に決めます。

| 軸               | 値                                     | 判断内容                           |
| ---------------- | -------------------------------------- | ---------------------------------- |
| `Operation Lane` | `DIRECT` / `BEHAVIOR` / `ARCHITECTURE` | 振る舞い・構造をどの運用で扱うか   |
| `UX Mode`        | `NONE` / `CONTINUITY` / `SHAPE`        | 利用者に見える体験をどう扱うか     |
| `Review Depth`   | `STANDARD` / `DEEP`                    | 独立レビューをどの深さで実施するか |

- `DIRECT`: 観測可能な振る舞いも物質的な内部構造も変えない。OpenSpec Change は不要です。
- `BEHAVIOR`: 観測可能な振る舞いを変更する。`behavior-change` の OpenSpec Change が必要です。
- `ARCHITECTURE`: 物質的な内部構造を変更する。`architecture-change` の OpenSpec Change が必要です。
- `SHAPE` は UX の方向付けが必要な場合だけ使用します。運用区分から UX モードを推測しません。
- 実際の UI 変更にはプロダクトデザイナーの関与と、デスクトップ・モバイル双方の実ブラウザ確認が必要です。
- 画像生成による UI モックアップは任意の非契約証跡であり、仕様や実ブラウザ確認を置き換えません。
- `STANDARD` を既定とし、重要なセキュリティ、データ、外部契約、移行、領域横断の構造、活動中 Change との相互作用に危険がある場合は `DEEP` を選びます。

OpenSpec Changeは、`BEHAVIOR`なら`pnpm exec openspec new change <change-id> --schema behavior-change`、`ARCHITECTURE`なら`pnpm exec openspec new change <change-id> --schema architecture-change`で作成し、`openspec/changes/**`を手作業で作りません。OpenSpec `1.8.0`の`new change`は`openspec/config.yaml#schema`をChange作成時の既定値として参照しないため、`--schema`を省略しません。OpenCodeの公式コアコマンドとスキルは`pnpm gen:openspec`でOpenSpec `1.8.0`から同時に再生成し、`.opencode/commands/opsx-*.md`と`.opencode/skills/openspec-*/SKILL.md`を手編集しません。

OpenSpec の `tasks.md` は粗い作業パッケージ台帳です。ファイル、補助処理、試験階層の詳細は、現在の作業パッケージと検証結果に基づき実装時に段階的に決めます。

一つの Change に対する Scenario と試験の追跡は次で確認し、完了前には引数なしの全体検査も実行します。

```bash
node scripts/openspec/verify-scenario-coverage.mjs --change <change-id>
node scripts/openspec/verify-scenario-coverage.mjs --change <change-id> --require-test-references
node scripts/openspec/verify-scenario-coverage.mjs
```

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
3. アプリケーション版へ影響する変更では`pnpm changeset`で通常Changesetを追加する。versionを上げない変更は`pnpm changeset --empty`を使い、template保守だけの変更にはChangesetを追加しない
4. `pnpm lint` と `pnpm check`、関連テストを通す
5. `develop` 向けプルリクエストに以下を記載
   - 変更の目的/背景
   - 変更点の要約
   - `Operation Lane`、`UX Mode`、`Review Depth`
   - `OpenSpec Change` と `Scenario IDs`。`BEHAVIOR` と `ARCHITECTURE` では必須、`DIRECT` では理由付きの `なし` を使用可能
   - 動作確認内容（コマンド、確認手順）
   - 破壊的変更がある場合は影響範囲と移行方法
   - 実際の UI / UX 変更がある場合は `Desktop Before`、`Desktop After`、`Mobile Before`、`Mobile After` の画像

## リリース

- `develop`のCI成功後、通常ChangesetがあればPrepare Release Workflowが`release`とRelease PRを作成または更新します。
- Release PRはmerge commitで`main`へ取り込みます。squash mergeとrebase mergeは使用しません。
- Release PRが`main`へ取り込まれると、Release Workflowが`vX.Y.Z`tagとGitHub Releaseを作成します。
- Release Workflowが検証済みtagをDeploy Workflowへ明示dispatchし、Cloudflare credentialsが設定済みの場合だけ本番環境へdeployします。
- リリース後は`sync/main-to-develop` PRが作成され、明示dispatchされたrequired checks成功後に自動mergeされます。
- merge済みの`release`と`sync/main-to-develop`はCleanup Release Branches Workflowが自動削除します。
- 生成先repositoryで必要なActionsのPR作成権限、ruleset、Production Environment設定は`docs/release-operations.md`を参照してください。リリース用GitHub AppやPATは使用しません。
- Cloudflare Deploy Button では `https://deploy.workers.cloudflare.com/?url=https://github.com/[アカウント名]/[リポジトリ名]/tree/main` を使用します。
- Deploy Button/Workers Builds は `package.json` の `deploy` script を使い、`pnpm build && wrangler deploy --env production` を実行します。
- Deploy Button/Workers Builds では、`wrangler.toml` の production placeholder を有効な D1 database ID と KV namespace ID に置き換え、必要な R2 bucket を事前に用意します。
- GitHub Actionsの`production` Environmentに`CLOUDFLARE_API_TOKEN`と`CLOUDFLARE_ACCOUNT_ID`がある場合、Deploy WorkflowはD1/KV/R2を名前で作成または再利用し、実ID入りの一時Wrangler設定で直接deployします。未設定の場合もリリース自体は成功します。
- このrepoはrootから `pnpm build` と `wrangler deploy --env production` を実行する前提です。frontend assetsは `packages/frontend/dist`、backend entryは `packages/backend/src/entry/index.ts` です。
- Workers Builds の build variable には `PNPM_VERSION=11.16.0` を設定し、pnpmのバージョン差によるinstall差分を避けてください。
- Cloudflare Email Routing は送信元/送信先の検証が必要なため、Deploy Button後にCloudflare dashboardで設定してください。

不明点があれば Issue/PR で相談してください。
