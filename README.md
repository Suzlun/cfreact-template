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
├── packages/
│   ├── frontend/
│   │   └── src/
│   │       ├── app/
│   │       ├── domain/
│   │       └── api/
│   ├── backend/
│   │   ├── orval.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── entry/
│   │       ├── app/
│   │       ├── generated/
│   │       │   └── api/
│   │       ├── modules/
│   │       │   ├── users/
│   │       │   ├── hello/
│   │       │   └── health/
│   │       ├── platform/
│   │       └── types/
│   ├── ui/
│   │   ├── .storybook/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stories/
│   │   └── styles/
│   └── typespec/
│       ├── main.tsp
│       ├── src/
│       └── openapi/
├── drizzle/
│   └── migrations/
├── openspec/
├── tests/
├── scripts/
├── docs/
├── .devcontainer/
├── .github/
├── wrangler.toml
├── drizzle.config.ts
├── pnpm-workspace.yaml
└── package.json
```

| パス                                  | 役割                                              |
| ------------------------------------- | ------------------------------------------------- |
| `packages/frontend/src/app/`          | React のアプリ起動、ルーター、画面                |
| `packages/frontend/src/domain/`       | TanStack Query hooks と provider                  |
| `packages/frontend/src/api/`          | OpenAPI 生成 SDK と API ラッパー                  |
| `packages/backend/src/entry/`         | `Cloudflare Workers` の公開エントリーポイント     |
| `packages/backend/src/app/`           | 構成起点と依存の組み立て                          |
| `packages/backend/src/generated/api/` | `openapi-typescript` と `Orval` の完全生成物      |
| `packages/backend/src/modules/`       | リソースごとの処理、業務、永続化、ドメイン規則    |
| `packages/backend/src/platform/`      | `Cloudflare`、`Drizzle`、メール、観測のアダプター |
| `packages/backend/src/types/`         | リソース間で共有する型                            |
| `packages/backend/orval.config.ts`    | リソース別 `Hono` 経路とハンドラーの生成設定      |
| `packages/backend/tsconfig.json`      | バックエンド全体を検査する単一 `TypeScript` 設定  |
| `packages/ui/`                        | Base UI ベースの共通 components/hooks             |
| `packages/ui/stories/`                | 共通 UI の Storybook catalog                      |
| `packages/typespec/`                  | API 契約の正と OpenAPI 生成先                     |
| `drizzle/migrations/`                 | D1 マイグレーション                               |
| `openspec/`                           | 永続的な振る舞い契約と変更差分                    |

### バックエンドのリソース中心構造

`Cloudflare Workers` の入口は `packages/backend/src/entry/index.ts` に集約し、`app` の構成起点が生成リソース、モジュールの公開入口、基盤アダプター、共有型を組み立てます。リポジトリの構築に必要なモジュール内部実装は、バックエンド専用の `@cfreact-template/backend/composition/modules/*` から `app` だけが参照します。各リソースは `modules/<resource>/` に閉じ、次の責務を持ちます。

現在のリソースは `users`、`hello`、`health` です。`users` はハンドラー、サービス、リポジトリの順に処理し、`Drizzle` スキーマも所有します。`hello` と `health` は永続化や業務サービスを必要としないため、生成リソースからスマートハンドラーまでで応答を完結します。

- `handlers/`: `Orval` が生成する HTTP 前置きと、開発者が所有するスマートハンドラー本体。
- `*.service.ts`: 入力の業務処理、リポジトリの調整、通知などの副作用の制御。
- `*.repository.ts`: リソース所有のデータへアクセスする `Drizzle` リポジトリ。
- `domain/`: リソース固有の純粋なドメイン規則。
- `*.schema.ts` と `*.ts`: リソース所有のスキーマ、応答、型、補助処理。
- `index.ts`: 他のリソースが利用できる唯一の公開入口。

`eslint-plugin-boundaries` はリソース名を捕捉して同一リソースの内部依存だけを許可します。別リソースのサービスを使う場合は、そのリソースの `index.ts` だけを参照します。モジュール内の相対インポートは許可しますが、リソースをまたぐ相対インポート、親ディレクトリへの逃避、モジュール深部のパッケージインポートは失敗します。パッケージの公開先も `Cloudflare Workers`、`app`、共有型、各リソースの `index.ts` に限定し、生成物、基盤アダプター、ハンドラー、リポジトリ、スキーマ、構成起点専用別名を公開しません。

バックエンドの外部パッケージは `boundaries/external` が既定で拒否します。`Hono` は構成起点、ハンドラー、HTTP 基盤、生成された検証処理だけ、`ulid` はサービスだけ、`Drizzle` はリポジトリ、スキーマ、データベース基盤だけ、`cloudflare:email` はメール基盤だけ、`@cloudflare/workers-types` は共有型だけ、`vitest`は同じリソースの純粋試験だけで利用できます。ハンドラーとサービスは HTTP グローバルを直接使わず、ハンドラーは `env` を直接参照しません。

完全生成物は `packages/backend/src/generated/api/` に置かれ、`openapi-typescript` が共有 OpenAPI 型を、`Orval` がリソース別 `Hono` 経路、検証処理、コンテキスト、`Zod` スキーマを生成します。このディレクトリは生成器が全面的に所有するため、手で編集しません。`Orval` はスマートハンドラーの前置きも生成しますが、その関数本体は開発者が実装します。

バックエンド全体は `packages/backend/tsconfig.json` 一つで型検査し、`pnpm --filter @cfreact-template/backend check:types` が `tsc --noEmit` を実行します。`packages/backend/package.json` の公開先は `Cloudflare Workers`、`app`、共有型、`users`・`hello`・`health` の各 `index.ts` だけです。

### バックエンドのエラー処理

予測して処理する失敗は例外ではなく `Result` でリポジトリからサービス、ハンドラーへ渡します。ハンドラーは内部原因を含めず、`TypeSpec` 契約に沿った安全な `{ code, message }` だけを返します。永続化失敗はサービスが原因をログへ記録して固定の 500 応答へ変換し、捕捉されなかった例外は `app.onError` がログへ記録して同じ安全な 500 応答へ変換します。

生成された応答検証処理を使うハンドラーでは、`guardResponseValidation` が検証処理の外側で最終応答を確認します。検証詳細を含む不安全な 400 応答は例外となり、`app.onError` が原因を記録して固定の 500 応答を返します。ユーザー作成の 201 応答は生成された `CreateUserResponse` で明示的に解析し、入力検証が返す不安全な 400 応答は `app` が固定の `INVALID_REQUEST` 応答へ置き換えます。

ユーザーのメールアドレス重複は、`users.email` の一意制約と `ON CONFLICT DO NOTHING` の結果で判定します。データベースのエラー文は解析せず、重複を `USER_EMAIL_ALREADY_EXISTS` の 409 応答へ変換します。

## 前提条件

- **Docker**（Dev Containers 用）
- **VS Code**（Dev Containers 拡張機能付き）

または手動セットアップの場合：

- **Node.js** 24.12.0 以降
- **pnpm** 11.16.0 以降
- **Cloudflare アカウント**（デプロイ用）

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

4. **Cloudflare リソースをセットアップ:**

   ```bash
   # D1 データベースを作成
   wrangler d1 create cfreact-template-db

   # KV 名前空間を作成
   wrangler kv:namespace create KV

   # R2 バケットを作成
   wrangler r2 bucket create cfreact-template-bucket
   ```

5. **wrangler.toml を更新:**
   - ステップ 4 で取得した実際の ID で `YOUR_DATABASE_ID_HERE`、`YOUR_KV_NAMESPACE_ID_HERE` を置き換える

6. **マイグレーションを生成・適用:**

   ```bash
   # マイグレーションファイルを生成
   pnpm migrate:generate

   # ローカルでマイグレーションを適用
   wrangler d1 execute cfreact-template-db --local --file=./drizzle/migrations/<migration-file>.sql

   # 本番環境でマイグレーションを適用
   wrangler d1 execute cfreact-template-db --remote --file=./drizzle/migrations/<migration-file>.sql
   ```

7. **開発サーバーを起動:**

   ```bash
   # フロントエンドとバックエンドの両方を起動
   pnpm dev:all

    # または個別に起動:
    pnpm dev:backend  # バックエンド http://localhost:8787 （@cfreact-template/backend）
    pnpm dev:frontend  # フロントエンド http://localhost:5173 （@cfreact-template/frontend）

    # 共通 UI catalog を起動
    pnpm storybook  # Storybook http://localhost:6006
   ```

8. **アプリケーションにアクセス:**
   - フロントエンド: http://localhost:5173
   - バックエンド API: http://localhost:8787/api/v1
   - Storybook: http://localhost:6006
   - Drizzle Studio: `pnpm migrate:studio`

### API 契約と生成物の再生成（`TypeSpec` → OpenAPI → バックエンド／フロントエンド）

このテンプレートでは `TypeSpec` を API 契約の正とします。`TypeSpec` から OpenAPI を生成し、`openapi-typescript` でバックエンド共有型を、`Orval` でバックエンドのリソース別 `Hono` 経路とスマートハンドラー、フロントエンドの SDK を自動生成します。

```bash
# TypeSpec -> OpenAPI -> バックエンド型・経路・ハンドラー -> フロントエンド SDK
pnpm gen:api-sdk
```

個別に実行する場合：

```bash
pnpm gen:openapi
pnpm --filter @cfreact-template/backend gen:api
pnpm --filter @cfreact-template/frontend gen:api
```

生成対象は `packages/typespec/openapi/openapi.json`、`packages/backend/src/generated/api/**`、
`packages/backend/src/modules/*/handlers/**`、`packages/frontend/src/api/generated/client.ts` です。
OpenAPI、`packages/backend/src/generated/api/**`、フロントエンド SDK は手で編集せず、入力の `TypeSpec` または `Orval` 設定を変更してから再生成してください。各生成段階は書き込み前に`scripts/codegen/verify-codegen-roots.mjs`で入出力ルートの実体経路をリポジトリ内へ限定し、配下のシンボリックリンクを拒否します。`Orval` のスマートハンドラーでは、生成前置きと検証処理は生成器が管理し、関数本体だけを開発者が実装します。バックエンド生成は `scripts/codegen/normalize-backend-handler-imports.mjs` でコンテキスト参照を型専用インポートへ正規化してから `Prettier` を実行します。

`pnpm check:codegen` は同じ生成処理を再実行し、OpenAPI のリソース `tag` と `operationId` に対応するハンドラーの不足、余分、生成リソースの残骸を検出します。さらに、現在の生成物と全ハンドラーディレクトリを動的に列挙し、`git ls-files --cached -z` でステージ済みの追加を受理しながら未追跡ファイルを拒否した後、OpenAPI、バックエンド生成物、スマートハンドラー、フロントエンド SDK の差分を検出します。

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
   - `/opsx-propose <name-or-description>` - Change を作成し、必要な成果物を生成
   - `/opsx-apply <name>` - 作業パッケージに沿って実装
   - `/opsx-sync <name>` - 差分仕様を主仕様に同期
   - `/opsx-archive <name>` - 完了した Change を履歴へ移動
   - `/opsx-explore <topic>` - 実装せずに調査・検討
   - `/change-builder <brief>` - 仕様設計を複数 change に分割して提案

## 開発ワークフロー

### 開発サーバーの起動

テンプレートは Vite のプロキシを使用して、フロントエンドからの `/api` リクエストを Workers 開発サーバーに転送します。

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

1. `wrangler.toml` の `EMAIL_FROM` と `EMAIL_TO` を開発用の値に更新
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

| スクリプト                                            | 説明                                                |
| ----------------------------------------------------- | --------------------------------------------------- |
| `pnpm dev:frontend`                                   | Vite 開発サーバーを起動（フロントエンド）           |
| `pnpm dev:backend`                                    | Wrangler 開発サーバーを起動（バックエンド）         |
| `pnpm dev:all`                                        | 両方のサーバーを同時に起動                          |
| `pnpm storybook`                                      | 共通 UI の Storybook 開発サーバーを起動             |
| `pnpm build`                                          | フロントエンドとバックエンドの両方をビルド          |
| `pnpm build:storybook`                                | Storybook の静的サイトをビルド                      |
| `pnpm check`                                          | TypeScript 型チェックを実行                         |
| `pnpm --filter @cfreact-template/backend check:types` | 単一 `tsconfig` でバックエンドを型検査する          |
| `pnpm gen:api-sdk`                                    | `TypeSpec` から API 生成物を再生成する              |
| `pnpm lint`                                           | UI 再利用、ESLint、OpenSpec、サプライチェーンを検証 |
| `pnpm lint:ui-reuse`                                  | 公開 UI catalog と UI/app 間のコード clone を検証   |
| `pnpm lint:supply-chain`                              | pnpm のサプライチェーン防御設定を検証               |
| `pnpm format`                                         | Prettier でコードをフォーマット                     |
| `pnpm format:check`                                   | CSS/YAML を含むフォーマット差分を検証               |
| `pnpm test:run`                                       | React/UI試験と純粋な業務・リリース規則試験を実行    |
| `pnpm test:frontend`                                  | Reactの顧客向けUI試験を実行                         |
| `pnpm test:ui-package`                                | 共通UIのjsdom試験を実行                             |
| `pnpm test:storybook`                                 | 全 Story を desktop/mobile・Light/Dark で検証       |
| `pnpm test:e2e`                                       | migration 済み E2E 専用 D1 を使う Playwright を実行 |
| `pnpm check:codegen`                                  | API 生成差分とバックエンドのハンドラー一覧を検証    |
| `pnpm migrate:generate`                               | Drizzle マイグレーションを生成                      |
| `pnpm migrate:studio`                                 | Drizzle Studio を開く                               |
| `pnpm deploy`                                         | Cloudflare Workers にデプロイ                       |
| `pnpm changeset`                                      | リリース内容とSemVer影響を記録                      |
| `pnpm test:release`                                   | 純粋で決定的なリリース規則試験を実行                |

CIは設定済みのPlaywrightブラウザを導入し、`pnpm test:run`でReactの顧客向けUI、共通UI、純粋なバックエンド業務・リリース規則を一度だけ検証します。続けて`pnpm test:storybook`、`pnpm test:e2e`、`pnpm build:storybook`を実行し、共通UIの実ブラウザ状態、高価値の顧客作業、Storybookの静的ビルドを必須検証にします。

### データベースマイグレーション

このテンプレートは、データベースマイグレーションに Drizzle Kit を使用します。

現在の `users` テーブルは `packages/backend/src/modules/users/users.schema.ts` が所有し、`drizzle.config.ts` はこのファイルをスキーマ入力にします。所有場所の変更で既存履歴を作り直さず、`drizzle/migrations/0000_daily_dorian_gray.sql` から続く同じマイグレーションストリームを維持します。

1. **スキーマを変更:**
   - 対象リソースの `packages/backend/src/modules/<resource>/*.schema.ts` を編集

2. **マイグレーションを生成:**

   ```bash
   pnpm migrate:generate
   ```

3. **ローカルでマイグレーションを適用:**

   ```bash
   wrangler d1 execute cfreact-template-db --local --file=./drizzle/migrations/<file>.sql
   ```

4. **本番環境でマイグレーションを適用:**

   ```bash
   wrangler d1 execute cfreact-template-db --remote --file=./drizzle/migrations/<file>.sql
   ```

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

詳細な API 仕様は `packages/typespec/openapi/openapi.json` を参照してください。

## デプロイ

### GitHub Release Workflow

`develop`のCIが成功すると`.github/workflows/prepare-release.yml`が`release`とRelease PRを作成または更新します。Release PRがmerge commitで`main`へ取り込まれると、`.github/workflows/release.yml`が`vX.Y.Z`tag、GitHub Release、`main -> develop`同期PRを処理します。merge済みの`release`と`sync/main-to-develop`は`.github/workflows/cleanup-release-branches.yml`が自動削除し、次回処理時に最新のbase branchから再作成します。

`.github/workflows/release.yml`は新しい`vX.Y.Z`tagとGitHub Releaseを作成した後、`.github/workflows/deploy.yml`へtagを明示してdispatchします。`production` EnvironmentにCloudflare credentialsが設定されている場合だけ、ビルド、D1/KV/R2の作成または再利用、本番環境へのデプロイを実行します。credentialsがなければデプロイだけを省略し、タグとGitHub Releaseには影響しません。

Changesets、branch運用、ActionsのPR作成権限、ruleset、Production Environmentを含む生成先repositoryの設定は[`docs/release-operations.md`](docs/release-operations.md)を参照してください。リリース認証はrepository固有の`GITHUB_TOKEN`だけを使い、GitHub App、PAT、Client ID、private keyは不要です。

Cloudflare Deploy Button からデプロイする場合は、次の URL を使用します。

```text
https://deploy.workers.cloudflare.com/?url=https://github.com/[アカウント名]/[リポジトリ名]/tree/main
```

Cloudflare Deploy Button は、ユーザー自身の GitHub/GitLab account に repository を複製し、Workers Builds で `package.json` の `deploy` script を実行します。このテンプレートでは `pnpm build && wrangler deploy --env production` が使われます。Deploy Button 経由で実行する場合は、`wrangler.toml` の production placeholder を有効な D1 database ID / KV namespace ID に置き換え、必要な R2 bucket を事前に用意してください。

GitHub Actions側では`production` Environmentの`CLOUDFLARE_API_TOKEN`と`CLOUDFLARE_ACCOUNT_ID`を使用し、Deploy Workflow内でD1/KV/R2を名前から作成または再利用します。実ID入りの一時Wrangler設定を使って直接`wrangler deploy`するため、公開branchにはaccount固有IDを置かず、Actions内だけで`.wrangler/release.wrangler.toml`を生成します。

このrepoはrootの `wrangler.toml` から `packages/backend/src/entry/index.ts` をWorker entryとして参照し、`packages/frontend/dist` をWorkers Static Assetsとして配信します。`pnpm build` がbackend type checkとfrontend buildを実行するため、Deploy Button/Workers BuildsとGitHub Actions CDのどちらもrepo rootから実行する構造です。

Deploy Button の setup 画面または Workers Builds 設定では、pnpm のバージョンを固定するために次の build variable を設定してください。

| 種別     | 名前           | 値        | 用途                                              |
| -------- | -------------- | --------- | ------------------------------------------------- |
| Variable | `PNPM_VERSION` | `11.16.0` | Workers Builds の pnpm をリポジトリ設定に合わせる |

GitHub Actionsから直接CDする場合は、GitHub repository settings に次も設定してください。

| 種別             | 名前                    | 用途                                                     |
| ---------------- | ----------------------- | -------------------------------------------------------- |
| Secret           | `CLOUDFLARE_API_TOKEN`  | `production` Environmentでresource作成とdeployを実行する |
| VariableかSecret | `CLOUDFLARE_ACCOUNT_ID` | `production` EnvironmentのCloudflare account ID          |
| Variable（任意） | `WRANGLER_ENVIRONMENT`  | `production` Environment。未設定時は`production`         |

Cloudflare Email Routing は送信元/送信先の検証が必要なため、Deploy Button の自動provision対象には含めません。メール送信を使う場合は、デプロイ後に Cloudflare dashboard で Email Routing を有効化し、verified email を設定してください。

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

4. **本番環境リソースをセットアップ:**

   GitHub Actions と同じ自動作成・再利用処理を使う場合は、次を実行します。

   ```bash
   CLOUDFLARE_ACCOUNT_ID=<account-id> \
   CLOUDFLARE_API_TOKEN=<api-token> \
   WRANGLER_ENVIRONMENT=production \
   pnpm release:provision-cloudflare
   ```

   これにより `.wrangler/release.wrangler.toml` が生成されます。公開 branch に account 固有 ID を置かないための一時 config です。

5. **デプロイ:**

   ```bash
   pnpm exec wrangler deploy --config .wrangler/release.wrangler.toml --env production
   ```

   `pnpm deploy` は root `wrangler.toml` を直接使うため、production placeholder を実 ID に置き換えた環境でのみ使ってください。

### 環境変数

GitHub Actionsからリリースする場合は、Cloudflare認証情報を`production` Environmentへ設定します。ActionsのPR作成権限を含む全設定は`docs/release-operations.md`を参照してください。

アプリケーション実行時の送信元/送信先は `wrangler.toml` の `EMAIL_FROM` と `EMAIL_TO` で設定します。D1/KV/R2 は Wrangler binding として提供されるため、`CLOUDFLARE_DATABASE_ID` や `CLOUDFLARE_D1_TOKEN` をアプリケーション secret として設定する構成ではありません。

## OpenSpec と変更運用

変更運用の一次資料は [`docs/change-operation.md`](docs/change-operation.md) です。すべての変更で、次の三軸を独立に選びます。

- `Operation Lane`: `DIRECT`、`BEHAVIOR`、`ARCHITECTURE`
- `UX Mode`: `NONE`、`CONTINUITY`、`SHAPE`
- `Review Depth`: `STANDARD`、`DEEP`

`DIRECT` は観測可能な振る舞いも物質的な内部構造も変えない作業です。`BEHAVIOR` は `behavior-change`、`ARCHITECTURE` は `architecture-change` の OpenSpec Change を使用します。UX の方向付けは任意であり、必要な変更だけが `SHAPE` を選びます。実際の UI 変更にはプロダクトデザイナーの関与と、デスクトップ・モバイル双方の実ブラウザ確認が必要です。画像生成による UI モックアップは任意の非契約証跡であり、仕様や実ブラウザ確認を置き換えません。

### 永続的な振る舞い契約

OpenSpec は、利用者または外部契約から観測できる振る舞いの永続的な契約であり、実装全体の基本計画ではありません。

- 主仕様は `openspec/specs/**/spec.md` に置きます。
- 活動中の差分仕様は `openspec/changes/*/specs/**/spec.md` に置きます。
- `behavior-change` は提案、差分仕様、作業パッケージを管理します。
- `architecture-change` はこれらに加え、物質的な設計判断を `design.md` で管理します。
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

このリポジトリは`@fission-ai/openspec` `1.8.0`、`openspec/config.yaml`、二つの変更スキーマを使用します。OpenCodeの公式コアコマンドとスキルは手編集せず、`pnpm gen:openspec`でOpenSpec公式の`init`から同時に再生成します。Changeディレクトリも手作成せず、運用区分に対応する`--schema`を付けた`openspec new change`で作成します。OpenSpec `1.8.0`は`openspec/config.yaml#schema`をChange作成時の既定値として参照しないため、`--schema`を省略しません。

```bash
pnpm gen:openspec
pnpm exec openspec new change <change-id> --schema behavior-change
pnpm exec openspec list
pnpm lint:openspec
```

### スラッシュコマンド

OpenCode で以下のコマンドが使えます：

- **`/opsx-propose <name-or-description>`** - Change を作成し、必要な成果物を生成
- **`/opsx-apply <name>`** - 作業パッケージに沿って実装
- **`/opsx-sync <name>`** - 差分仕様を主仕様へ同期
- **`/opsx-archive <name>`** - 完了した Change を履歴へ移動
- **`/opsx-explore <topic>`** - 実装せずに調査・検討
- **`/opsx-update <name>`** - 既存の計画成果物を整合させる

### 使用例

```
# OpenCode 内で実行
/opsx-propose add-user-auth
/opsx-apply add-user-auth
```

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

共通デザイン token は `packages/ui/styles/globals.css`、Tailwind v4 の Vite plugin 設定は `packages/frontend/vite.config.ts` で管理します。shadcn/ui registry 設定は `packages/ui/components.json` にあり、`base-nova` style と `@base-ui/react` の primitive を使用します。既存の共通コンポーネントは `packages/ui/components/` から import できます。

`Calendar` は `mode="range"` で範囲日付選択に対応します。OS 標準の picker や form semantics が必要な場合は `NativeSelect` を、列定義ベースの一覧には `DataTable` を利用してください。

### 新しいルートの追加

1. `packages/frontend/src/app/pages/` にページコンポーネントを作成
2. `packages/frontend/src/app/router.tsx` にルートを追加

### 新しい API ルートの追加

1. `packages/typespec/src/routes/**` と必要なモデルを更新
2. `pnpm gen:api-sdk` を実行
3. 生成された `packages/backend/src/generated/api/<resource>/` のリソース経路を確認
4. `packages/backend/src/modules/<resource>/handlers/` のスマートハンドラー本体だけを実装
5. `packages/backend/src/app/server.ts` へリソース入口を追加する必要がある場合は `app` の構成起点として登録
6. `pnpm check:codegen` でハンドラー一覧と全生成差分を検証

リソースのパス、HTTP メソッド、スキーマ、検証処理は `TypeSpec` と生成器が所有します。手書きの `Hono` 経路を別に作ったり、生成された経路ファイルを直接編集したりしません。

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
- **Bindings error:** `wrangler.toml` に正しいバインディング ID があることを確認

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
