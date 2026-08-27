# Contributing

プロジェクトへの貢献に感謝します。レビューと保守をしやすくするため、以下のガイドラインに従ってください。

## ドキュメント

- コーディング規則（一次資料）: `CODING_STANDARDS.md`
  - `eslint.config.js` は規約の自動検査（実装）として追従させます
- 変更運用（一次資料）: `docs/change-operation.md`
- 永続的な振る舞い契約: `openspec/specs/**/spec.md`
  - `pnpm lint` で変更スキーマ、提案、厳格な成果物形式、Playwright E2E試験からScenarioへの一方向参照、作業パッケージと設計の対象範囲を検査します
  - 活動中差分は同期前から構造、識別子、競合を検査し、Scenarioから自動試験への参照は要求しません

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
  - 例: `packages/typespec/openapi/openapi.json`、`packages/backend/src/generated/**`、`packages/backend/src/modules/*/handlers/**` の `Orval` 前置き、`packages/frontend/src/api/generated/**`
- 振る舞い契約が変わる変更は仕様と必要な試験を一緒に更新する
  - Playwright E2E試験だけが題名から既存Scenarioを`[...-S001]`の形式で参照する
  - Scenarioごとの自動試験は要求せず、純粋な単体試験、Reactの顧客向けUI試験、Storybookブラウザ試験はScenario識別子を参照しない
  - Playwright E2E、純粋で決定的な単体試験、Reactの顧客向けUI試験、Storybookブラウザ試験だけを使用する
  - Reactの顧客向けUI試験では、利用者に見える描画と操作を保全する目的でjsdom、MSW、Testing Libraryを利用できる
  - Workerd固有、実データベース、接続、バックエンドHTTP・OpenAPI契約、ファイルシステム・子プロセスを使うツール自己試験を作らない
  - 試験専用の製品側API、公開要素、生成処理、分岐、Binding、設定を作らない
- `BEHAVIOR`と`ARCHITECTURE`では、利用者が選択した`openspec/proposer`がRequest候補を会話で提示し、所有者の明示確認後だけChangeと`Request-Status: CONFIRMED`の`request.md`を作成する
  - 具体的な解決手段より先に、利用者、現在の状況、変更動機、期待価値、望む成果を一つずつ確認し、確認済みの背景と変更動機を専用節へ保存する
  - 変更動機には、困りごとや制約だけでなく、期待、機会、好奇心、未探索の可能性も含める
  - 背景と変更動機は要求の理由として扱い、それ自体からRequirementや成果制約を作らない
  - 利用者が`openspec/proposer`をプライマリエージェントとして選択し、所有者への質問、Request更新、全計画成果物の作成を所有させる
  - 成果物の意味に関わる内容が自明でない場合は推測せず逐次確認し、背景、変更動機、期待価値、成果、成果制約、必須手段として明確な回答は確認証拠とともに`request.md`へ即時反映する
  - 解決手段を示す入力は背景、変更動機、希望成果を先に確認し、所有者が拘束した場合だけ必須手段として扱う
  - `proposal.md`、Specsは確認済みRequestから直接導ける肯定的成果だけを記録し、非目標、対象外、却下案、旧実装の不在、追加しない技術または機能を契約化しない
  - Requestの内容は成果物の意味に従って分配し、技術や構造は設計へ、観測可能な顧客価値はSpecsへ、実装成果は粗いWork Packageへ記載する
  - 不要なRequirementは`REMOVED Requirements`で除去し、反対向きのRequirementへ置き換えない

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
- `architecture-change`が観測可能な振る舞いを変更しない場合は`.openspec.yaml`に`skip_specs: true`を設定し、差分仕様、Requirement、Scenarioを作成しません。
- `SHAPE` は UX の方向付けが必要な場合だけ使用します。運用区分から UX モードを推測しません。
- 実際の UI 変更にはプロダクトデザイナーの関与と、デスクトップ・モバイル双方の実ブラウザ確認が必要です。
- 画像生成による UI モックアップは任意の非契約証跡であり、仕様や実ブラウザ確認を置き換えません。
- `STANDARD` を既定とし、重要なセキュリティ、データ、外部契約、移行、領域横断の構造、活動中 Change との相互作用に危険がある場合は `DEEP` を選びます。

OpenSpec Changeは、`BEHAVIOR`なら`pnpm exec openspec new change <change-id> --schema behavior-change`、`ARCHITECTURE`なら`pnpm exec openspec new change <change-id> --schema architecture-change`で作成し、`openspec/changes/**`を手作業で作りません。OpenSpec `1.8.0`の`new change`は`openspec/config.yaml#schema`をChange作成時の既定値として参照しないため、`--schema`を省略しません。`pnpm gen:openspec`は公式コマンドとスキルを同時に再生成し、生成物を手編集しません。

計画には`openspec/proposer`、実装には`openspec/applier`を利用者が選択します。Proposerは全計画成果物、Applierは実装統括と`tasks.md`の進捗だけを所有します。計画の意味変更が必要になった場合は、ApplierからProposerへ利用者が切り替えます。

OpenSpec の `tasks.md` は粗い作業パッケージ台帳です。ファイル、補助処理、試験階層の詳細は、現在の作業パッケージと検証結果に基づき実装時に段階的に決めます。

`architecture-change`の`design.md`は、存在する全delta Spec Unitをパッケージで代替可能な汎用能力へ分解し、`Reuse Assessment`へ再利用元分類、採用判断、対象と版、対象能力を調査範囲に含む調査報告を記載します。`skip_specs: true`の場合はSpec Unitや調査行を捏造しません。Requirement対応表は外部候補調査の証拠にならず、推移依存は対象packageの直接依存として宣言するまで採用済みと扱いません。`pnpm lint:openspec`は存在するSpec Unitの欠落、分類値、調査報告の実在を検査します。

一つの Change に対する Scenario と試験の追跡は次で確認し、完了前には引数なしの全体検査も実行します。

```bash
node scripts/openspec/verify-scenario-coverage.mjs --change <change-id>
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

API 契約（`TypeSpec`）を変更したら、OpenAPI、バックエンドの共有型とリソース経路、スマートハンドラー、フロントエンド SDK を一括で再生成してください。正の入力は `packages/typespec/main.tsp` であり、サーバー経路や生成済み OpenAPI を入力へ戻しません。

```bash
pnpm gen:api-sdk
```

内部の生成段階だけを確認する場合は、次を使えます。

```bash
pnpm gen:openapi
pnpm --filter @cfreact-template/backend gen:api
pnpm --filter @cfreact-template/frontend gen:api
```

`openapi-typescript` は `packages/backend/src/generated/api/openapi.ts` を、`Orval` は `packages/backend/src/generated/api/<resource>/**` と `packages/backend/src/modules/<resource>/handlers/**` を生成します。各生成段階は書き込み前に`scripts/codegen/verify-codegen-roots.mjs`で入出力ルートの実体経路をリポジトリ内へ限定し、配下のシンボリックリンクを拒否します。`packages/backend/src/generated/api/**` は完全に生成器が所有します。`Orval` のスマートハンドラーでは生成前置きと検証処理を変更せず、開発者が所有する関数本体だけを実装します。生成後は `scripts/codegen/normalize-backend-handler-imports.mjs` がコンテキスト参照を型専用インポートへ正規化し、`Prettier` が整形します。

生成後は `pnpm check:codegen` を実行してください。このコマンドは OpenAPI のリソース `tag` と `operationId` に対応するハンドラーの不足、余分、生成リソースの残骸を検出します。続いて現在の生成物と全ハンドラーディレクトリを動的に列挙し、`git ls-files --cached -z` でステージ済み追加を受理しながら未追跡ファイルを拒否した後、生成差分を検出します。

バックエンドの配置は `entry -> app` を入口とし、`app` が生成リソース、モジュール、基盤アダプター、共有型を組み立てます。現在の `users` はハンドラー、サービス、リポジトリとリソース所有スキーマを持ち、`hello` と `health` はハンドラーだけで完結します。新しい処理も必要な責務だけを同じリソースの `modules/<resource>/` に置き、外部アダプターは `platform/`、リソース間で共有する型は `types/` に置いてください。バックエンド全体の型検査には `packages/backend/tsconfig.json` 一つだけを使います。

別リソースを利用するサービスは `@cfreact-template/backend/modules/<resource>` の `index.ts` だけを使い、生成物、ハンドラー、リポジトリ、スキーマを深いパスから参照しません。リポジトリ構築のための `@cfreact-template/backend/composition/modules/*` は `app` だけが使えます。外部パッケージは `boundaries/external` の要素別許可表に限定し、`vitest`は同じリソースの純粋試験だけで利用します。ハンドラーとサービスは HTTP グローバルを直接使わず、ハンドラーは `env` を直接参照しません。

予測して処理する失敗は `Result` で返し、ハンドラーでは内部原因を含まない `{ code, message }` へ変換します。生成された応答検証処理には `guardResponseValidation` を先行させ、不安全な検証詳細は `app.onError` が記録して固定の 500 応答へ変換します。ユーザー作成の成功応答は生成スキーマで解析し、メールアドレス重複はデータベースの一意制約の結果で判定して 409 応答へ変換します。データベースのエラー文は解析しません。

### DB

スキーマを変更したらマイグレーションを生成してください。

`users` テーブルは `packages/backend/src/modules/users/users.schema.ts` が所有します。既存の `drizzle/migrations/0000_daily_dorian_gray.sql` を置き換えたり履歴を開始し直したりせず、同じマイグレーションストリームへ差分を追加します。

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
pnpm check:codegen
```

`pnpm lint` には UI 再利用、ESLint、OpenSpec、サプライチェーン設定チェックが含まれます。

必要に応じて関連テストも実行してください。

```bash
pnpm test:run        # React/UI試験と純粋な業務・リリース規則試験
pnpm test:frontend   # Reactの顧客向けUI試験
pnpm test:ui-package # 共通UIのjsdom試験
pnpm test:storybook  # Storybookの実ブラウザ試験
pnpm test:e2e        # migration 済み E2E 専用 D1 を使う Playwright
```

CIはPlaywrightのChromium、Firefox、WebKitを導入し、`pnpm test:run`、`pnpm test:storybook`、`pnpm test:e2e`、`pnpm build:storybook`を必須検証として実行します。`pnpm test:run`にはReactの顧客向けUI試験と共通UI試験が含まれるため、CIでは`pnpm test:frontend`と`pnpm test:ui-package`を重複実行しません。

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
