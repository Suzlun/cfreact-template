# cfreact-template

**Cloudflare Workers** 上で React、Hono、Drizzle ORM を使用した本番環境対応アプリケーションを構築するためのフルスタックテンプレート。

## 技術スタック

### フロントエンド

- **React** 19.2.7 - UI ライブラリ
- **Vite** 8.0.16 - ビルドツール
- **React Router** 7.17.0 - ルーティング
- **TanStack Query** 5.101.0 - データフェッチとキャッシング
- **shadcn/ui / Radix UI / Tailwind CSS** 3.4.19 - アクセシブルな共通コンポーネントとスタイリング
- **TypeScript** 5.9+ - 型安全性

### バックエンド

- **Hono** 4.11.3 - 高速で軽量な Web フレームワーク
- **Drizzle ORM** 0.45.1 - D1 用の型安全 ORM
- **Cloudflare Workers** - サーバーレスランタイム
- **Cloudflare D1** - SQLite データベース
- **Cloudflare KV** - キーバリューストレージ
- **Cloudflare R2** - オブジェクトストレージ

### 開発環境

- **pnpm** 11.7.0 - 高速で効率的なパッケージマネージャー
- **Node.js** 24.12.0 LTS - 開発ツール用ランタイム
- **Wrangler** 4.57.0+ - Cloudflare CLI
- **ESLint** 9.39+ - リンティング（flat config）
- **Prettier** 3.7.4 - コードフォーマット
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
│   │   └── src/
│   │       ├── entry/
│   │       ├── app/
│   │       ├── http/
│   │       ├── usecases/
│   │       ├── domain/
│   │       ├── persistence/
│   │       ├── drizzle/
│   │       └── types/
│   ├── ui/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
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

| パス                                | 役割                                   |
| ----------------------------------- | -------------------------------------- |
| `packages/frontend/src/app/`        | React のアプリ起動、ルーター、画面     |
| `packages/frontend/src/domain/`     | TanStack Query hooks と provider       |
| `packages/frontend/src/api/`        | OpenAPI 生成 SDK と API ラッパー       |
| `packages/backend/src/entry/`       | Workers エントリーポイント             |
| `packages/backend/src/app/`         | DI とアプリケーション配線              |
| `packages/backend/src/http/`        | Hono ルートと HTTP 契約テスト          |
| `packages/backend/src/usecases/`    | アプリケーションサービス               |
| `packages/backend/src/domain/`      | ドメインモデルとリポジトリ契約         |
| `packages/backend/src/persistence/` | Drizzle 永続化アダプタ                 |
| `packages/backend/src/drizzle/`     | Drizzle schema exports                 |
| `packages/backend/src/types/`       | Workers Bindings などの共有型          |
| `packages/ui/`                      | Radix UI ベースの共通 components/hooks |
| `packages/typespec/`                | API 契約の正と OpenAPI 生成先          |
| `drizzle/migrations/`               | D1 マイグレーション                    |
| `openspec/`                         | OpenSpec 設定と仕様スキーマ            |

## 前提条件

- **Docker**（Dev Containers 用）
- **VS Code**（Dev Containers 拡張機能付き）

または手動セットアップの場合：

- **Node.js** 24.12.0 以降
- **pnpm** 11.7.0 以降
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
   ```

8. **アプリケーションにアクセス:**
   - フロントエンド: http://localhost:5173
   - バックエンド API: http://localhost:8787/api/v1
   - Drizzle Studio: `pnpm migrate:studio`

### API SDK の再生成 (TypeSpec -> OpenAPI -> SDK)

このテンプレートでは TypeSpec を API 契約の正（Single Source of Truth）とし、
TypeSpec から OpenAPI を生成してクライアント SDK（`packages/frontend/src/api`）を自動生成します。

```bash
# TypeSpec から OpenAPI を生成し、SDK を再生成
pnpm gen:api-sdk
```

個別に実行する場合：

```bash
pnpm gen:openapi
pnpm --filter @cfreact-template/frontend gen:api
```

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
   - `/opsx-propose <name-or-description>` - change を作成し、必要 artifact を生成
   - `/opsx-apply <name>` - tasks に沿って実装
   - `/opsx-sync <name>` - delta specs を main specs に同期
   - `/opsx-archive <name>` - 完了した change を archive
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

| スクリプト               | 説明                                                 |
| ------------------------ | ---------------------------------------------------- |
| `pnpm dev:frontend`      | Vite 開発サーバーを起動（フロントエンド）            |
| `pnpm dev:backend`       | Wrangler 開発サーバーを起動（バックエンド）          |
| `pnpm dev:all`           | 両方のサーバーを同時に起動                           |
| `pnpm build`             | フロントエンドとバックエンドの両方をビルド           |
| `pnpm check`             | TypeScript 型チェックを実行                          |
| `pnpm lint`              | ESLint、OpenSpec、サプライチェーン設定チェックを実行 |
| `pnpm lint:supply-chain` | pnpm のサプライチェーン防御設定を検証                |
| `pnpm format`            | Prettier でコードをフォーマット                      |
| `pnpm format:check`      | CSS/YAML を含むフォーマット差分を検証                |
| `pnpm test:run`          | すべての Vitest project を非 watch で実行            |
| `pnpm test:frontend`     | frontend の Vitest project を実行                    |
| `pnpm test:backend`      | backend-http Vitest project を実行                   |
| `pnpm test:ui-package`   | UI package の Vitest project を実行                  |
| `pnpm test:e2e`          | migration 済み E2E 専用 D1 を使う Playwright を実行  |
| `pnpm check:codegen`     | OpenAPI / SDK の生成差分を検証                       |
| `pnpm migrate:generate`  | Drizzle マイグレーションを生成                       |
| `pnpm migrate:studio`    | Drizzle Studio を開く                                |
| `pnpm deploy`            | Cloudflare Workers にデプロイ                        |

### データベースマイグレーション

このテンプレートは、データベースマイグレーションに Drizzle Kit を使用します。

1. **スキーマを変更:**
   - `packages/backend/src/drizzle/schema.ts` を編集

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

- `GET /api/v1/hello` - シンプルなヘルスチェック

### Users

- `GET /api/v1/users` - すべてのユーザーを一覧表示
- `POST /api/v1/users` - 新しいユーザーを作成
- `GET /api/v1/users/:id` - ID でユーザーを取得

詳細な API 仕様は `packages/typespec/openapi/openapi.json` を参照してください。

## デプロイ

### GitHub Deploy Workflow

`main` の CI が成功すると `.github/workflows/deploy.yml` が起動します。GitHub Actions側に Cloudflare の認証情報が設定されている場合だけ、ビルド、D1/KV/R2 の作成または再利用、本番環境へのデプロイを実行します。

Cloudflare Deploy Button からデプロイする場合は、次の URL を使用します。

```text
https://deploy.workers.cloudflare.com/?url=https://github.com/[アカウント名]/[リポジトリ名]/tree/main
```

Cloudflare Deploy Button は、ユーザー自身の GitHub/GitLab account に repository を複製し、Workers Builds で `package.json` の `deploy` script を実行します。このテンプレートでは `pnpm build && wrangler deploy --env production` が使われます。Deploy Button 経由で実行する場合は、`wrangler.toml` の production placeholder を有効な D1 database ID / KV namespace ID に置き換え、必要な R2 bucket を事前に用意してください。

GitHub Actions側にも `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` が設定されている場合は、Deploy Workflow内でD1/KV/R2を名前で作成または再利用し、実ID入りの一時Wrangler設定を使って直接 `wrangler deploy` します。Actions CDではDeploy Buttonのresource provisioningが走らないため、公開branchにはaccount固有IDを置かず、Actions内だけで `.wrangler/release.wrangler.toml` を生成します。

このrepoはrootの `wrangler.toml` から `packages/backend/src/entry/index.ts` をWorker entryとして参照し、`packages/frontend/dist` をWorkers Static Assetsとして配信します。`pnpm build` がbackend type checkとfrontend buildを実行するため、Deploy Button/Workers BuildsとGitHub Actions CDのどちらもrepo rootから実行する構造です。

Deploy Button の setup 画面または Workers Builds 設定では、pnpm のバージョンを固定するために次の build variable を設定してください。

| 種別     | 名前           | 値       | 用途                                              |
| -------- | -------------- | -------- | ------------------------------------------------- |
| Variable | `PNPM_VERSION` | `11.7.0` | Workers Builds の pnpm をリポジトリ設定に合わせる |

GitHub Actionsから直接CDする場合は、GitHub repository settings に次も設定してください。

| 種別             | 名前                    | 用途                                           |
| ---------------- | ----------------------- | ---------------------------------------------- |
| Secret           | `CLOUDFLARE_API_TOKEN`  | Cloudflare APIでresource作成とdeployを実行する |
| VariableかSecret | `CLOUDFLARE_ACCOUNT_ID` | deploy/provision対象のCloudflare account ID    |
| Variable（任意） | `WRANGLER_ENVIRONMENT`  | Wrangler environment。未設定時は`production`   |

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

GitHub Actions から直接 CD する場合は、GitHub repository settings に次を設定します：

| 種別             | 名前                    | 用途                                           |
| ---------------- | ----------------------- | ---------------------------------------------- |
| Secret           | `CLOUDFLARE_API_TOKEN`  | Cloudflare APIでresource作成とdeployを実行する |
| VariableかSecret | `CLOUDFLARE_ACCOUNT_ID` | deploy/provision対象のCloudflare account ID    |
| Variable（任意） | `WRANGLER_ENVIRONMENT`  | Wrangler environment。未設定時は`production`   |

アプリケーション実行時の送信元/送信先は `wrangler.toml` の `EMAIL_FROM` と `EMAIL_TO` で設定します。D1/KV/R2 は Wrangler binding として提供されるため、`CLOUDFLARE_DATABASE_ID` や `CLOUDFLARE_D1_TOKEN` をアプリケーション secret として設定する構成ではありません。

## OpenSpec による仕様駆動開発

このテンプレートには、OpenSpec の運用をサポートするディレクトリ構造が含まれています。

### OpenSpec とは

OpenSpec は仕様駆動開発（Spec-Driven Development）のためのワークフローです。change（変更単位）に intent/proposal/specs/design/tasks を揃え、AI コーディングアシスタントと協力して、依頼の意味の確認から実装まで段階的に進めます。

### 基本の開発プロセス

1. **Intent**: 依頼を成果・必須制約・候補手段に分け、repository の事実と照合した解釈を所有者が確認する
2. **Proposal**: 確認済み Intent から目的・変更範囲・影響を固める
3. **Wireframe**: UIがある場合は`openspec/designer`がJSON、生成preview、screenshot evidenceを確定する
4. **Specs**: 仕様（要求・受け入れ条件）を文書化する
5. **Design**: 実装方針・設計を固める
6. **Tasks**: 実装可能なタスクに分解する
7. **Apply**: tasks に沿って実装する

`intent.md`が`CONFIRMED`になる前に下流 artifact を作成することは、`pnpm lint:openspec`で拒否されます。

### プロジェクトの初期化

この repository では `openspec/config.yaml` と schema が既に含まれています。CLI の状態確認には次を使います。

```bash
pnpm exec openspec list
```

### スラッシュコマンド

OpenCode で以下のコマンドが使えます：

- **`/opsx-propose <name-or-description>`** - change を作成し、必要 artifact を生成
- **`/opsx-apply <name>`** - tasks に沿って実装
- **`/opsx-sync <name>`** - delta specs を main specs に同期
- **`/opsx-archive <name>`** - change を archive
- **`/opsx-explore <topic>`** - 実装せずに調査・検討

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

### shadcn/ui / Tailwind テーマ

共通デザイン token は `packages/ui/styles/globals.css`、Tailwind v4 の Vite plugin 設定は `packages/frontend/vite.config.ts` で管理します。shadcn/ui registry 設定は `packages/ui/components.json` にあり、既存の共通コンポーネントは `packages/ui/components/` から import できます。

`Calendar` は `mode="range"` で範囲日付選択に対応します。OS 標準の picker や form semantics が必要な場合は `NativeSelect` を、列定義ベースの一覧には `DataTable` を利用してください。

### 新しいルートの追加

1. `packages/frontend/src/app/pages/` にページコンポーネントを作成
2. `packages/frontend/src/app/router.tsx` にルートを追加

### 新しい API ルートの追加

1. `packages/typespec/src/routes/v1/**` と必要な model を更新
2. `pnpm gen:api-sdk` を実行
3. `packages/backend/src/http/routes/` にルートハンドラーを作成
4. `packages/backend/src/http/routes/openapi-app.ts` に登録

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
- [Radix UI](https://www.radix-ui.com/)
- [TanStack Query ドキュメント](https://tanstack.com/query/latest)
- [OpenSpec](https://github.com/fission-ai/openspec)
