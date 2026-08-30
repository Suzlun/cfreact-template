# cfreact-template

**Cloudflare Workers** 上で React、Hono、Drizzle ORM を使用した本番環境対応アプリケーションを構築するためのフルスタックテンプレート。

## 技術スタック

### フロントエンド

- **React** 19.2.7 - UI ライブラリ
- **Vite** 8.0.16 - ビルドツール
- **React Router** 7.17.0 - ルーティング
- **TanStack Query** 5.101.0 - データフェッチとキャッシング
- **shadcn/ui**（**Base UI** 1.6.0）/ **Tailwind CSS** 4.2.4 - アクセシブルな共通コンポーネントとスタイリング
- **TypeScript** 5.9+ - 型安全性

### バックエンド

- **Hono** 4.12.25 - 高速で軽量な Web フレームワーク
- **Drizzle ORM** 0.45.2 - D1 用の型安全 ORM
- **Cloudflare Workers** - サーバーレスランタイム
- **Cloudflare D1** - SQLite データベース
- **Cloudflare KV** - キーバリューストレージ
- **Cloudflare R2** - オブジェクトストレージ

### 開発環境

- **pnpm** 11.16.0 - 高速で効率的なパッケージマネージャー
- **Node.js** 24.12.0 LTS - 開発ツール用ランタイム
- **Wrangler** 4.57.0+ - Cloudflare CLI
- **ESLint** 9.39+ - リンティング（flat config）
- **Prettier** 3.7.4 - コードフォーマット
- **Storybook** 10.5.2 - 共通 UI のカタログ、操作、アクセシビリティ検証
- **Dev Containers** - 一貫した開発環境
- **Serena MCP** - セマンティックコード検索・編集（OpenCode 統合）
- **agent-browser** - AI エージェント向けブラウザ自動操作 CLI と OpenCode MCP

## プロジェクト構成

主要なソースと運用ディレクトリのみを示します。`node_modules/` や生成キャッシュは省略しています。

```text
cfreact-template/
├── apps/
│   └── main/
│       ├── src/
│       │   ├── frontend/
│       │   │   ├── app/
│       │   │   ├── domain/
│       │   │   └── api/
│       │   └── backend/
│       │       ├── entry/
│       │       ├── app/
│       │       ├── generated/
│       │       ├── modules/
│       │       ├── platform/
│       │       └── types/
│       ├── typespec/
│       └── wrangler.toml
├── packages/
│   ├── core/
│   │   ├── src/
│   │   ├── typespec/
│   │   ├── drizzle/
│   │   └── wrangler.toml
│   ├── core-sdk/
│   │   └── src/
│   ├── ui/
│   └── build-config/
├── infra/
│   └── terraform/
├── openspec/
├── tests/
├── scripts/
├── docs/
├── .devcontainer/
├── .github/
├── pnpm-workspace.yaml
└── package.json
```

| パス                                | 役割                                            |
| ----------------------------------- | ----------------------------------------------- |
| `apps/main/`                        | React、Hono、TypeSpecを一体配備する公開システム |
| `apps/main/src/frontend/app/`       | Reactのアプリ起動、ルーター、画面               |
| `apps/main/src/frontend/domain/`    | TanStack Query hooksとprovider                  |
| `apps/main/src/frontend/api/`       | main OpenAPI生成SDKとAPIラッパー                |
| `apps/main/src/backend/`            | main WorkerのHono入口と公開API                  |
| `apps/main/typespec/`               | main公開API契約の正                             |
| `packages/core/`                    | 非公開core Worker、共有業務、Repository、D1     |
| `packages/core/typespec/`           | core内部API契約の正                             |
| `packages/core-sdk/`                | core OpenAPIから生成するサーバー専用SDK         |
| `packages/core/drizzle/migrations/` | coreが所有するD1マイグレーション                |
| `packages/ui/`                      | Base UIベースの共通components/hooks             |
| `infra/terraform/production/`       | productionのD1、KV、R2を管理するTerraform設定   |

### システムの追加

React + Hono + TypeSpecのシステムは`apps/<name>`へ一つのworkspace packageとして追加し、`dev`、`build`、`check`、`gen:api`、`deploy:dry-run`を実装します。TypeSpecからそのシステムのHono経路とfrontend SDKを生成し、共有業務が必要なHandlerだけが`@cfreact-template/core-sdk`を利用します。配備対象は`.release/deploy-targets.json`へ明示登録します。

Next.jsなどの一体型システムも`apps/<name>`へ置き、ルートから見える同じscript契約だけを揃えます。内部構造をReact + Honoへ無理に合わせず、外部APIを所有する場合だけTypeSpecを追加します。

### バックエンドのリソース中心構造

各公開システムは `apps/<name>` にReact、Hono、TypeSpecをまとめ、一つのWorkerとオリジンへ配備します。現在の`apps/main`では、ブラウザーがmain TypeSpec生成SDKでmain Honoを呼び、main Honoがcore TypeSpec生成の`@cfreact-template/core-sdk`で非公開core Workerを呼びます。

```text
React -> main SDK -> main Hono -> core SDK -> core Hono -> Service -> Repository -> D1
```

`apps/main`は公開契約、画面固有の応答写像、`hello`、`health`を所有します。`packages/core`は共有業務、`users`のService、Repository、Drizzleスキーマ、D1、メール、マイグレーションを所有します。main backendはcore実装を直接インポートせず、`packages/core-sdk`だけを利用します。

core SDKは実行時に基底URL、Bearerトークン、Web標準`fetch`を受け取ります。現在のCloudflare構成では`CORE_API` Service Bindingの`fetch`を渡しますが、通信契約自体はCloudflareへ依存しません。片側または両側を別の実行基盤へ置く場合も、同じTypeSpec契約を証明書検証済みHTTPSとBearer認証で実装します。

| バックエンド | core         | 通信方式                     |
| ------------ | ------------ | ---------------------------- |
| Cloudflare   | Cloudflare   | Service Binding + Bearer認証 |
| Cloudflare   | Cloudflare外 | HTTPS + Bearer認証           |
| Cloudflare外 | Cloudflare   | coreのHTTPS経路 + Bearer認証 |
| Cloudflare外 | Cloudflare外 | HTTPS + Bearer認証           |

main TypeSpec生成経路とcore TypeSpec生成経路は別の契約です。main Handlerはcoreの状態番号とDTOをmain公開契約へ明示的に写像し、core内部のエラー本文や実装型をブラウザーへ透過しません。生成サーバーファイルとSDKは手編集せず、スマートハンドラーの本体だけを実装します。

外部パッケージがHTTP配下経路を所有する場合は、対象Workerの最上位Honoへ具体的にマウントします。外部経路はTypeSpecへ複写せず、製品API向けCORS、400応答整形、生成応答検証の対象外にします。既存のWorker-first接頭辞外へ置く場合はWranglerの`run_worker_first`にも基底パスを追加します。空のプラグイン登録表や動的探索は作りません。

### バックエンドのエラー処理

予測して処理する失敗はcore内部で`Result`としてRepositoryからService、Handlerへ渡し、core HTTP契約の安全な`{ code, message }`へ変換します。main Handlerはcore SDK結果をmain TypeSpec契約へ再変換します。core通信の認証失敗、通信失敗、未知の状態番号、生成スキーマ違反は、利用者の認証状態として公開せず、内部原因を記録して固定500を返します。

生成された応答検証処理を使うハンドラーでは、`guardResponseValidation` が検証処理の外側で最終応答を確認します。検証詳細を含む不安全な 400 応答は例外となり、`app.onError` が原因を記録して固定の 500 応答を返します。ユーザー作成の 201 応答は生成された `CreateUserResponse` で明示的に解析し、入力検証が返す不安全な 400 応答は `app` が固定の `INVALID_REQUEST` 応答へ置き換えます。

ユーザーのメールアドレス重複は、`users.email` の一意制約と `ON CONFLICT DO NOTHING` の結果で判定します。データベースのエラー文は解析せず、重複を `USER_EMAIL_ALREADY_EXISTS` の 409 応答へ変換します。

## 前提条件

- **Docker**（Dev Containers 用）
- **VS Code**（Dev Containers 拡張機能付き）

または手動セットアップの場合：

- **Node.js** 24.12.0 以降
- **pnpm** 11.16.0 以降
- **Cloudflare アカウント**（デプロイ用）
- **Terraform** 1.16（長期Cloudflare資源の管理用）

## セットアップ

### 方法 1: Dev Container を使用

1. **リポジトリをクローン:**

   ```bash
   git clone <your-repo-url>
   cd cfreact-template
   ```

2. **VS Code で開く:**

   ```bash
   code .
   ```

3. **コンテナで再度開く:**
   - `Cmd+Shift+P`（Mac）または `Ctrl+Shift+P`（Windows/Linux）を押す
   - "Dev Containers: Reopen in Container" を選択
   - コンテナのビルドと依存関係のインストールを待つ

   **注意:** Git 設定（`.gitconfig`）と認証情報は VS Code によって自動的に共有されます。

4. **productionのCloudflareリソースをTerraformでセットアップ:**

   ```bash
   terraform -chdir=infra/terraform/production init -backend-config=/path/to/production.tfbackend
   terraform -chdir=infra/terraform/production plan
   terraform -chdir=infra/terraform/production apply
   ```

   HCP Terraformのremote backendを使用し、Cloudflare API tokenは環境変数で渡します。Terraform stateやbackend設定をGitへ追加しません。

5. **ローカルcore通信用のBearerトークンを設定:**

   ```bash
   export CORE_API_TOKEN="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))")"
   ```

   mainとcoreを起動する同じシェルへ設定します。`.env`や`.dev.vars`へ保存する場合はGitへ追加しません。

6. **ローカルD1へマイグレーションを適用:**

   ```bash
   pnpm migrate:generate
   pnpm migrate:apply
   ```

   productionの未適用マイグレーションはDeploy Workflowがcore配備前に一度だけ適用します。

7. **開発サーバーを起動:**

   ```bash
   # フロントエンドとバックエンドの両方を起動
   pnpm dev:all

    # または個別に起動:
    pnpm dev:backend  # mainとcoreのWorker http://localhost:8787
    pnpm dev:frontend  # React http://localhost:5173

    # 共通 UI catalog を起動
    pnpm storybook  # Storybook http://localhost:6006
   ```

8. **アプリケーションにアクセス:**
   - フロントエンド: http://localhost:5173
   - バックエンド API: http://localhost:8787/api/v1
   - Storybook: http://localhost:6006
   - Drizzle Studio: `pnpm migrate:studio`

### API契約と生成物の再生成

`apps/main/typespec`は公開main API、`packages/core/typespec`は非公開core APIの正です。各TypeSpecからOpenAPI、Hono経路、スマートハンドラー、利用側SDKを生成します。

```bash
# 両TypeSpec -> 両Honoサーバー -> frontend SDK + core SDK
pnpm gen:api-sdk
```

個別に実行する場合：

```bash
pnpm gen:openapi
pnpm gen:backend
pnpm gen:core
```

生成対象は両OpenAPI、両Workerの`generated/api/**`とスマートハンドラー、main frontend SDK、`packages/core-sdk/src/generated/client.ts`です。生成物を手で編集せず、TypeSpecまたはOrval設定を変更してから再生成してください。

`pnpm check:codegen`は両契約を再生成し、両Handler一覧、全生成物のGit管理、シンボリックリンク、生成差分を検査します。

### 方法 2: 手動セットアップ

**前提条件:**

- Node.js 24.12.0 以降
- Python 3.11 以降（Serena MCP 用）
- agent-browser CLI（ブラウザ自動操作用。Dev Container では Chrome for Testing または OS Chromium とあわせて自動導入）

1. **依存関係をインストール:**

   ```bash
   corepack enable
   pnpm install
   ```

   `pnpm-workspace.yaml` の `minimumReleaseAge: 4320` により、npm 公開から72時間未満のパッケージはインストール対象から外れます。リリース前の依存追加・更新は、少なくとも72時間前に完了してください。

2. **Wrangler をグローバルインストール:**

   ```bash
   npm install -g wrangler@4
   ```

3. **uv をインストール（任意、Python ツール導入用）:**

   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Windows
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

4. **OpenCode CLI をインストール（オプション、AI 支援開発用）:**

   ```bash
   npm install -g opencode-ai@latest
   ```

5. **agent-browser CLI とブラウザをインストール（AI ブラウザ操作用）:**

   ```bash
   sh .devcontainer/scripts/install-agent-browser.sh
   ```

6. 方法 1 のステップ 4-8 に従ってください。

**注意:** Dev Container には、これらすべてのツールがプリインストールされています（Node.js 24、Python 3、pnpm、Wrangler、uv、OpenCode CLI、OpenSpec CLI、agent-browser CLI、Chrome for Testing または OS Chromium）。

### OpenCode + OpenSpec セットアップ

AI 支援開発に OpenCode と OpenSpec を使用する場合：

1. **OpenCode を設定:**

   ```bash
   opencode auth
   ```

2. **OpenSpec 設定を確認:**

   ```bash
   pnpm exec openspec list
   ```

3. **OpenCode 内でスラッシュコマンドを使用:**
   - `openspec/proposer` - 背景と変更動機から逐次確認し、Requestと必要な成果物を作成するプライマリエージェント
   - `openspec/applier` - 作業パッケージ、実装委任、進捗、検証を統括するプライマリエージェント
   - `/opsx-propose <name-or-description>` - OpenSpec公式の汎用提案コマンド
   - `/opsx-apply <name>` - OpenSpec公式の汎用適用コマンド
   - `/opsx-sync <name>` - 差分仕様を主仕様に同期
   - `/opsx-archive <name>` - 完了した Change を履歴へ移動
   - `/opsx-explore <topic>` - 実装せずに調査・検討
   - `/change-builder <brief>` - 仕様設計を複数 change に分割して提案

## 開発ワークフロー

### 開発サーバーの起動

テンプレートは Vite のプロキシを使用して、フロントエンドからの `/api` リクエストを Workers 開発サーバーに転送します。

バックエンドを起動するシェルには、mainとcoreで共有する開発用`CORE_API_TOKEN`を設定してください。値は利用環境ごとに生成し、ブラウザーへ公開しません。

```bash
# ターミナル 1: Workers バックエンドを起動
pnpm dev:backend

# ターミナル 2: React フロントエンドを起動
pnpm dev:frontend

# または両方を同時に起動
pnpm dev:all
```

### Workers Email のローカル検証

`pnpm dev:backend` で Wrangler を起動している状態で、`POST /api/v1/users` を叩くと
`env.EMAIL.send()` が呼ばれ、Wrangler がローカルに `.eml` ファイルを出力します。

1. `packages/core/wrangler.toml`の`EMAIL_FROM`と`EMAIL_TO`を開発用の値に更新
2. サーバーを起動

   ```bash
   pnpm dev:backend
   ```

3. 別ターミナルでユーザー作成 API を実行

   ```bash
   curl --request POST 'http://localhost:8787/api/v1/users' \
     --header 'Content-Type: application/json' \
     --data '{"name":"Email Test User","email":"email-test@example.com"}'
   ```

4. `pnpm dev:backend` 側のログに出る `.eml` ファイルパスを確認

本番で送信を有効化する場合は Cloudflare Email Routing を有効化し、`EMAIL_FROM` と `EMAIL_TO`
を運用値に変更してください。

### 利用可能なスクリプト

| スクリプト                                           | 説明                                                  |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `pnpm dev:frontend`                                  | Vite 開発サーバーを起動（フロントエンド）             |
| `pnpm dev:backend`                                   | Wrangler 開発サーバーを起動（バックエンド）           |
| `pnpm dev:all`                                       | 両方のサーバーを同時に起動                            |
| `pnpm storybook`                                     | 共通 UI の Storybook 開発サーバーを起動               |
| `pnpm build`                                         | フロントエンドとバックエンドの両方をビルド            |
| `pnpm build:storybook`                               | Storybook の静的サイトをビルド                        |
| `pnpm check`                                         | TypeScript 型チェックを実行                           |
| `pnpm --filter @cfreact-template/main check:backend` | 単一 `tsconfig` でバックエンドを型検査する            |
| `pnpm gen:api-sdk`                                   | `TypeSpec` から API 生成物を再生成する                |
| `pnpm lint`                                          | UI 再利用、ESLint、OpenSpec、サプライチェーンを検証   |
| `pnpm lint:ui-reuse`                                 | 公開 UI catalog と UI/app 間のコード clone を検証     |
| `pnpm lint:supply-chain`                             | pnpm のサプライチェーン防御設定を検証                 |
| `pnpm format`                                        | Prettier でコードをフォーマット                       |
| `pnpm format:check`                                  | CSS/YAML を含むフォーマット差分を検証                 |
| `pnpm test:run`                                      | React/UI試験と純粋なSDK・業務・リリース規則試験を実行 |
| `pnpm test:frontend`                                 | Reactの顧客向けUI試験を実行                           |
| `pnpm test:ui-package`                               | 共通UIのjsdom試験を実行                               |
| `pnpm test:storybook`                                | 全 Story を desktop/mobile・Light/Dark で検証         |
| `pnpm test:e2e`                                      | migration 済み E2E 専用 D1 を使う Playwright を実行   |
| `pnpm check:codegen`                                 | API 生成差分とバックエンドのハンドラー一覧を検証      |
| `pnpm migrate:generate`                              | Drizzle マイグレーションを生成                        |
| `pnpm migrate:studio`                                | Drizzle Studio を開く                                 |
| `pnpm deploy`                                        | Cloudflare Workers にデプロイ                         |
| `pnpm changeset`                                     | リリース内容とSemVer影響を記録                        |
| `pnpm test:release`                                  | 純粋で決定的なリリース規則試験を実行                  |

CIは設定済みのPlaywrightブラウザを導入し、`pnpm test:run`でReactの顧客向けUI、共通UI、純粋なcore SDK通信規則、バックエンド業務・リリース規則を一度だけ検証します。続けて`pnpm test:storybook`、`pnpm test:e2e`、`pnpm build:storybook`を実行し、共通UIの実ブラウザ状態、高価値の顧客作業、Storybookの静的ビルドを必須検証にします。

### データベースマイグレーション

このテンプレートは、データベースマイグレーションに Drizzle Kit を使用します。

現在の `users` テーブルは `packages/core/src/modules/users/users.schema.ts` が所有し、`packages/core/drizzle.config.ts` はこのファイルをスキーマ入力にします。所有場所の変更で既存履歴を作り直さず、`packages/core/drizzle/migrations/0000_daily_dorian_gray.sql` から続く同じマイグレーションストリームを維持します。

1. **スキーマを変更:**
   - 対象リソースの`packages/core/src/modules/<resource>/*.schema.ts`を編集

2. **マイグレーションを生成:**

   ```bash
   pnpm migrate:generate
   ```

3. **ローカルでマイグレーションを適用:**

   ```bash
   pnpm migrate:apply
   ```

4. **本番環境でマイグレーションを適用:**

   Deploy Workflowが`wrangler d1 migrations apply`をcore配備前に実行します。手動配備でも同じ順序を維持してください。

5. **Drizzle Studio でデータベースを表示:**

   ```bash
   pnpm migrate:studio
   ```

## API エンドポイント

### Hello

- `GET /api/v1/hello` - Hono と Workers からの挨拶を返す

### Health

- `GET /health` - Worker が応答可能であることを返す

### Users

- `GET /api/v1/users` - すべてのユーザーを一覧表示
- `POST /api/v1/users` - 新しいユーザーを作成
- `GET /api/v1/users/:id` - ID でユーザーを取得

詳細な API 仕様は `apps/main/typespec/openapi/openapi.json` を参照してください。

## デプロイ

### GitHub Release Workflow

`develop`のCIが成功すると`.github/workflows/prepare-release.yml`が`release`とRelease PRを作成または更新します。Release PRがmerge commitで`main`へ取り込まれると、`.github/workflows/release.yml`が`vX.Y.Z`tag、GitHub Release、`main -> develop`同期PRを処理します。merge済みの`release`と`sync/main-to-develop`は`.github/workflows/cleanup-release-branches.yml`が自動削除し、次回処理時に最新のbase branchから再作成します。

`.github/workflows/release.yml`は新しい`vX.Y.Z`tagとGitHub Releaseを作成した後、`.github/workflows/deploy.yml`へtagを明示してdispatchします。`production` EnvironmentのCloudflareとHCP Terraform credentialsが設定されている場合だけ、Terraform state確認、migration、core、mainの順で配備します。credentialsがなければデプロイだけを省略します。

Changesets、branch運用、ActionsのPR作成権限、ruleset、Production Environmentを含む生成先repositoryの設定は[`docs/release-operations.md`](docs/release-operations.md)を参照してください。リリース認証はrepository固有の`GITHUB_TOKEN`だけを使い、GitHub App、PAT、Client ID、private keyは不要です。

productionの長期資源はTerraform、WorkerコードとBindingはWrangler、D1 migrationは`packages/core`が所有します。同じCloudflare資源をTerraformとWranglerの双方から作成しません。

GitHubの`production` Environmentには次を設定します。

| 種別             | 名前                       | 用途                                   |
| ---------------- | -------------------------- | -------------------------------------- |
| Secret           | `CLOUDFLARE_API_TOKEN`     | migrationとWorker配備                  |
| Secret           | `CORE_API_TOKEN`           | mainからcoreへの内部Bearer認証         |
| VariableかSecret | `CLOUDFLARE_ACCOUNT_ID`    | productionのCloudflare account ID      |
| Secret           | `HCP_TERRAFORM_TOKEN`      | HCP Terraform remote stateの読み取り   |
| Secret           | `TERRAFORM_BACKEND_CONFIG` | remote backendのorganization/workspace |
| Variable（任意） | `WRANGLER_ENVIRONMENT`     | 未設定時は`production`                 |

通常リリースは`core`、`main`の順にすべて配備します。手動再配備では`core`または`main`を選択でき、`main`を選ぶと同じタグの`core`も先に配備されます。

### Cloudflare Workers にデプロイ

1. **Cloudflare にログイン:**

   ```bash
   wrangler login
   ```

2. **アプリケーションをビルド:**

   ```bash
   pnpm build
   ```

3. **依存関係のリリース猶予を確認:**

   ```bash
   pnpm lint:supply-chain
   ```

   依存追加・更新を含むリリースでは、対象パッケージの npm 公開から72時間以上経過していることを確認してください。

4. **Terraform stateからWrangler設定を生成:**

   ```bash
   terraform -chdir=infra/terraform/production output -json > .wrangler/terraform-outputs.json
   pnpm release:render-wrangler -- --terraform-outputs .wrangler/terraform-outputs.json
   ```

   これにより`packages/core/wrangler.release.toml`と`apps/main/wrangler.release.toml`が生成されます。どちらもGit管理しません。

5. **migrationと配備:**

   ```bash
   pnpm --filter @cfreact-template/core exec wrangler d1 migrations apply DB --config packages/core/wrangler.release.toml --env production --remote
   pnpm release:deploy-targets -- --targets all --environment production --secrets-file /secure/path/worker-secrets.json
   ```

   `--secrets-file`で指定するファイルには`CORE_API_TOKEN`だけをJSONまたはdotenv形式で保存し、権限を所有者だけに限定して配備後に削除します。GitHub ActionsではDeploy Workflowがこの一時ファイルを作成して除去します。

### 環境変数

GitHub Actionsからリリースする場合は、Cloudflare認証情報と256ビット以上のランダムな`CORE_API_TOKEN`を`production` Environmentへ設定します。Deploy Workflowは同じ値をmainとcoreのWorker Secretへ登録します。ActionsのPR作成権限を含む全設定は`docs/release-operations.md`を参照してください。

メール送信元と宛先は`packages/core/wrangler.toml`、mainのKV/R2とcoreのD1は各Wrangler Bindingで設定します。資源IDはTerraform outputから一時設定へ注入し、公開branchへ保存しません。`CORE_API_TOKEN`は平文の`vars`やTerraform stateへ保存せず、利用環境のSecret管理から両バックエンドへ注入します。

## OpenSpec と変更運用

変更運用の一次資料は [`docs/change-operation.md`](docs/change-operation.md) です。すべての変更で、次の三軸を独立に選びます。

- `Operation Lane`: `DIRECT`、`BEHAVIOR`、`ARCHITECTURE`
- `UX Mode`: `NONE`、`CONTINUITY`、`SHAPE`
- `Review Depth`: `STANDARD`、`DEEP`

`DIRECT` は通常、観測可能な振る舞いも物質的な内部構造も変えない作業です。加えて、このリポジトリ自身の再利用可能なテンプレート保守で、現在のサンプルアプリケーションの振る舞いを維持する変更も`DIRECT`としてOpenSpecを作成しません。この例外はテンプレートから生成されたプロダクトリポジトリへ引き継ぎません。`BEHAVIOR`は`behavior-change`、`ARCHITECTURE`は`architecture-change`を使用します。

### 永続的な振る舞い契約

OpenSpec は、利用者または外部契約から観測できる振る舞いの永続的な契約であり、実装全体の基本計画ではありません。

- 主仕様は `openspec/specs/**/spec.md` に置きます。
- 活動中の差分仕様は `openspec/changes/*/specs/**/spec.md` に置きます。
- `behavior-change` は提案、差分仕様、作業パッケージを管理します。
- `architecture-change` は提案、物質的な設計判断、作業パッケージを管理し、観測可能な振る舞いも変更する場合だけ差分仕様を持ちます。
- 観測可能な振る舞いを変更しない`architecture-change`は`.openspec.yaml`に`skip_specs: true`を設定し、差分仕様、Requirement、Scenarioを作成しません。
- Requirement と Scenario には観測可能な終端状態だけを記載します。
- `tasks.md` は粗い作業パッケージ台帳とし、ファイル、補助処理、試験階層ごとの詳細計画を置きません。

実装時は、現在の作業パッケージ、リポジトリの実態、直前の検証結果を基に、ファイル・補助処理・試験の詳細を段階的に決めます。

### Scenario と試験

Scenario見出しは`(USER-MGMT-S001)`のような安定した識別子で終えます。追跡はPlaywright E2E試験からScenarioへの一方向であり、試験題名から`[USER-MGMT-S001]`のように既存Scenarioを参照できます。Scenarioごとの自動試験は要求せず、純粋な単体試験、Reactの顧客向けUI試験、Storybookブラウザ試験はScenario識別子を参照しません。

許可する自動試験は、価値の高い顧客作業を通すPlaywright E2E、顧客成果へ影響する決定的な規則の純粋な単体試験、利用者に見える描画と操作を保全するReact UI試験、顧客向け共通UIを実ブラウザで保全するStorybook試験です。React UI試験では目的に応じてjsdom、MSW、Testing Libraryを利用できます。Workerd固有、実データベース、接続、バックエンドHTTP・OpenAPI契約、ファイルシステム・子プロセスを使うツール自己試験は作成しません。

既定の検査は、活動中差分の構造、識別子の重複、Change間の競合と、Playwright E2E試験題名にあるScenario参照の有効性を確認します。一つのChangeを確認した後、相互作用の最終確認として引数なしの検査も実行します。

```bash
node scripts/openspec/verify-scenario-coverage.mjs --change <change-id>
node scripts/openspec/verify-scenario-coverage.mjs
```

### プロジェクトの初期化

このリポジトリは`@fission-ai/openspec` `1.8.0`、`openspec/config.yaml`、二つの変更スキーマを使用します。`pnpm gen:openspec`はOpenSpec公式のコマンドとスキルを同時に再生成し、生成物は手編集しません。Changeディレクトリも手作成せず、運用区分に対応する`--schema`を付けた`openspec new change`で作成します。OpenSpec `1.8.0`は`openspec/config.yaml#schema`をChange作成時の既定値として参照しないため、`--schema`を省略しません。

```bash
pnpm gen:openspec
pnpm exec openspec new change <change-id> --schema behavior-change
pnpm exec openspec list
pnpm lint:openspec
```

### OpenSpec操作

OpenCodeでは次のプライマリエージェントと公式コマンドを利用できます。

- **`openspec/proposer`** - 背景、変更動機、Request、全計画成果物を所有するプライマリエージェント
- **`openspec/applier`** - 作業パッケージ、実装委任、進捗、検証を所有するプライマリエージェント
- **`/opsx-propose <name-or-description>`** - OpenSpec公式の汎用提案コマンド
- **`/opsx-apply <name>`** - OpenSpec公式の汎用適用コマンド
- **`/opsx-sync <name>`** - 差分仕様を主仕様へ同期
- **`/opsx-archive <name>`** - 完了した Change を履歴へ移動
- **`/opsx-explore <topic>`** - 実装せずに調査・検討
- **`/opsx-update <name>`** - 既存の計画成果物を整合させる

### 使用例

1. OpenCodeのエージェント選択で`openspec/proposer`を選び、実現したい成果や現在の関心を伝える。
2. `Planning Ready: YES`の報告後、`openspec/applier`へ切り替えてChange識別子を伝える。

## Serena MCP - セマンティックコード検索

このテンプレートには、OpenCode と統合できる Serena MCP Server が設定されています。Serena は Language Server Protocol (LSP) を使用して、IDE 並みのコード理解機能を提供します。

### 機能

- **セマンティック検索**: シンボルレベルでのコード検索
- **定義へのジャンプ**: "Go to Definition" 機能
- **参照の検索**: "Find All References" 機能
- **インテリジェント編集**: コンテキストを理解したコード編集
- **メモリ管理**: コードベースのコンテキストを保持

### 使用方法

OpenCode などから以下のように使用できます：

```bash
# プロジェクトをアクティベート（初回のみ）
"Activate the current dir as project using serena"

# セマンティック検索
"Find all references to the User type using serena"
"Show me the definition of apiClient using serena"
"Find all usages of the createUser function using serena"
```

### Web ダッシュボード

Serena のダッシュボードにアクセスして、ログやプロジェクト情報を確認できます：

```
http://localhost:24282/dashboard
```

### 設定ファイル

- **`.serena/project.yml`**: プロジェクト固有の設定

### セキュリティ

デフォルトでは `read_only: true` に設定されており、ファイルの読み取りのみが可能です。ファイル編集機能を有効にする場合は、`.serena/project.yml` で `read_only: false` に変更してください。

詳細については、https://github.com/oraios/serena を参照してください。

## agent-browser - AI ブラウザ自動操作

このテンプレートには、AI エージェントがローカルの Vite アプリや外部サイトを操作するための agent-browser が設定されています。Dev Container では `agent-browser` CLI とブラウザを自動導入し、OpenCode からは `.opencode/opencode.json` の `agent-browser mcp` 経由で利用できます。Linux ARM64 では Chrome for Testing が提供されないため、Dockerfile で導入した OS Chromium を利用します。

### 使い方

```bash
# ローカルフロントエンドを開く
agent-browser open http://localhost:5173

# AI が参照しやすいアクセシビリティツリーを取得
agent-browser snapshot

# スクリーンショットを保存
agent-browser screenshot page.png

# ブラウザセッションを閉じる
agent-browser close
```

### OpenCode MCP

OpenCode では `.opencode/opencode.json` に `agent-browser mcp` が登録されています。設定変更後は OpenCode を再起動すると、ブラウザ操作、スナップショット取得、スクリーンショット取得などを MCP ツールとして利用できます。

### セキュリティ

agent-browser の state ファイルや認証情報を含むエクスポートファイルはセッショントークンを含む可能性があります。`agent-browser state save` などで作成した認証状態ファイルはリポジトリへ追加せず、必要がなくなったら削除してください。

## カスタマイズ

### Storybook

共通 UI catalog は `packages/ui/stories/` にあり、1つの公開対象につき1つの `*.stories.tsx` で管理します。`pnpm storybook` で開発サーバーを起動し、`pnpm build:storybook` で静的出力、`pnpm test:storybook` で全 Story の interaction と accessibility を desktop/mobile・Light/Dark の4環境で検証します。

Story は製品コードへ import せず、`@cfreact-template/ui/*` の公開 subpath から対象を直接 import してください。Storybook 固有の依存境界と公式推奨 ESLint ルールは `eslint.config.js` で強制されます。

`pnpm lint:ui-reuse` は UI source、package export、root barrel、Story の対応を検査し、Storybook catalog を再実装検知にも利用します。frontend から Base UI などの内部 primitive を直接利用すること、app で公開 UI と同名の値を宣言・再 export すること、`packages/ui` の実装を app へコピーすることは `pnpm lint` で失敗します。

### shadcn/ui / Base UI / Tailwind テーマ

共通デザイン token は `packages/ui/styles/globals.css`、Tailwind v4 の Vite plugin 設定は `apps/main/vite.config.ts` で管理します。shadcn/ui registry 設定は `packages/ui/components.json` にあり、`base-nova` style と `@base-ui/react` の primitive を使用します。既存の共通コンポーネントは `packages/ui/components/` から import できます。

`Calendar` は `mode="range"` で範囲日付選択に対応します。OS 標準の picker や form semantics が必要な場合は `NativeSelect` を、列定義ベースの一覧には `DataTable` を利用してください。

### 新しいルートの追加

1. `apps/main/src/frontend/app/pages/` にページコンポーネントを作成
2. `apps/main/src/frontend/app/router.tsx` にルートを追加

### 新しい API ルートの追加

1. `apps/main/typespec/src/routes/**` と必要なモデルを更新
2. `pnpm gen:api-sdk` を実行
3. 生成された `apps/main/src/backend/generated/api/<resource>/` のリソース経路を確認
4. `apps/main/src/backend/modules/<resource>/handlers/` のスマートハンドラー本体だけを実装
5. `apps/main/src/backend/app/server.ts` へリソース入口を追加する必要がある場合は `app` の構成起点として登録
6. `pnpm check:codegen` でハンドラー一覧と全生成差分を検証

リソースのパス、HTTP メソッド、スキーマ、検証処理は `TypeSpec` と生成器が所有します。手書きの `Hono` 経路を別に作ったり、生成された経路ファイルを直接編集したりしません。

共有業務を追加する場合は`packages/core/typespec`とcore Handler/Serviceを先に変更し、生成された`core-sdk`をmain Handlerから利用します。外部パッケージが経路全体を所有する場合だけTypeSpecの対象外とし、最上位Honoへ明示的にマウントします。

## コード品質

このテンプレートには、一貫したコード標準を維持するための自動コード品質ツールが含まれています。

### Git フック

Git フックは Husky を介して自動的に設定されます：

- **pre-commit**: ステージされたファイルに lint-staged を実行
- **commit-msg**: コミットメッセージ形式を検証

### Lint-Staged

コミット用にステージされたファイルのみをリント・フォーマット：

```bash
# pre-commit で自動実行
pnpm lint-staged
```

`.lintstagedrc.json` の設定：

- TypeScript/JavaScript ファイル: ESLint 修正 + Prettier フォーマット
- CSS/JSON/Markdown/YAML ファイル: Prettier フォーマット

### コミットメッセージ規約

このプロジェクトは [Conventional Commits](https://www.conventionalcommits.org/) を使用：

```bash
# 有効なコミットメッセージ形式
feat: 新機能を追加
fix: ユーザー認証のバグを修正
docs: セットアップ手順で README を更新
style: prettier でコードをフォーマット
refactor: API ルートを再構築
perf: データベースクエリを最適化
test: ユーザーサービスのユニットテストを追加
build: 依存関係を更新
ci: GitHub Actions を設定
chore: .gitignore を更新
revert: 前回のコミットを取り消す
```

**無効なコミットは commit-msg フックによって拒否されます。**

### 手動品質チェック

必要に応じて手動でこれらのコマンドを実行：

```bash
# すべてのファイルをリント
pnpm lint

# すべてのファイルをフォーマット
pnpm format

# 変更なしでフォーマットをチェック
pnpm format:check

# すべてのパッケージの型チェック
pnpm check
```

## トラブルシューティング

### Dev Container の問題

- **ポートが使用中:** ポート 5173 または 8787 を使用しているローカルサーバーを停止
- **Permission denied:** Docker に適切な権限があることを確認

### Wrangler の問題

- **Database not found:** `wrangler d1 create` を実行してデータベースを作成
- **Bindings error:** main/coreのWrangler設定とTerraform outputが一致することを確認

### 型エラー

すべてのパッケージの型チェックを実行：

```bash
pnpm check
```

## コントリビュート

詳細は `CONTRIBUTING.md` を参照してください（ブランチ運用、チェック項目、SDK 再生成手順など）。コーディング規則は `CODING_STANDARDS.md` にまとめています。

## リソース

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Hono ドキュメント](https://hono.dev/)
- [Drizzle ORM ドキュメント](https://orm.drizzle.team/)
- [React ドキュメント](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Base UI](https://base-ui.com/)
- [TanStack Query ドキュメント](https://tanstack.com/query/latest)
- [OpenSpec](https://github.com/fission-ai/openspec)
