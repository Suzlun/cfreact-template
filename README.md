# cfreact-template

**Cloudflare Workers** 上で React、Hono、Drizzle ORM を使用した本番環境対応アプリケーションを構築するためのフルスタックテンプレート。

## 技術スタック

### フロントエンド

- **React** 19.2.3 - React Compiler サポート付き UI ライブラリ
- **Vite** 7.3.1 - ビルドツール
- **React Router** 7.12.0 - ルーティング
- **TanStack Query** 5.90.16 - データフェッチとキャッシング
- **Material UI** 7.3.6 - コンポーネントライブラリ
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
- **Sentrux** - アーキテクチャ品質ゲートと OpenCode MCP 構造監視
- **agent-browser** - AI エージェント向けブラウザ自動操作 CLI と OpenCode MCP

## プロジェクト構成

```
cfreact-template/
├── packages/
│   ├── typespec/                  # TypeSpec (API 契約) - OpenAPI の正
│   ├── client/
│   │   ├── app/                  # プレゼンテーション層 (pages/components/router) - Vite
│   │   ├── domain/               # ドメインフック層 (TanStack Query 等はここでのみ)
│   │   └── api/                  # OpenAPI 生成 SDK + API ラッパー（React 非依存）
│   ├── server/                   # Cloudflare Workers バックエンド（クリーンアーキ分割済み）
│   │   ├── types/                # Bindings 等の共有型
│   │   ├── domain/               # エンティティ/リポジトリIF
│   │   ├── usecases/             # アプリケーションサービス
│   │   ├── http/                 # Hono ルート（インバウンドアダプタ）
│   │   ├── persistence/          # Drizzle などの永続化アダプタ
│   │   ├── app/                  # DI / 配線
│   │   └── entry/                # Workers エントリーポイント
│   ├── drizzle/                  # Drizzle ORM スキーマ
│   │   └── src/schema.ts         # D1 テーブル定義
│   └── ui/                       # Material UI ベースの UI パッケージ
│       └── src/theme.ts          # テーマ設定
├── drizzle/
│   └── migrations/           # データベースマイグレーション
├── tests/                    # e2e などの統合テスト（Playwright）
├── .devcontainer/            # Dev Container 設定
├── wrangler.toml             # Cloudflare 設定
├── drizzle.config.ts         # Drizzle Kit 設定
├── pnpm-workspace.yaml       # pnpm ワークスペース設定
└── package.json              # ルート package.json
```

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
   - バックエンド API: http://localhost:8787/api
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
- Sentrux CLI（`pnpm lint` の構造品質ゲート用。Dev Container では自動導入）
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

5. **Sentrux CLI をインストール（構造品質ゲート用）:**

   ```bash
   sh .devcontainer/scripts/install-sentrux.sh
   ```

   このスクリプトは Sentrux の GitHub Releases latest を取得し、release asset の sha256 digest を検証してからインストールします。

6. **agent-browser CLI とブラウザをインストール（AI ブラウザ操作用）:**

   ```bash
   sh .devcontainer/scripts/install-agent-browser.sh
   ```

7. 方法 1 のステップ 4-8 に従ってください。

**注意:** Dev Container には、これらすべてのツールがプリインストールされています（Node.js 24、Python 3、pnpm、Wrangler、uv、OpenCode CLI、OpenSpec CLI、Sentrux CLI、agent-browser CLI、Chrome for Testing または OS Chromium）。

### OpenCode + OpenSpec セットアップ

AI 支援開発に OpenCode と OpenSpec を使用する場合：

1. **OpenCode を設定:**

   ```bash
   opencode auth
   ```

2. **OpenSpec を初期化:**

   ```bash
   openspec init
   ```

3. **OpenCode 内でスラッシュコマンドを使用:**
   - `/opsx-onboard` - OpenSpec の一連フローをオンボード
   - `/opsx-new <name>` - change を作成（段階的に artifact を作る）
   - `/opsx-ff <name>` - artifact を一括生成（実装開始可能まで）
   - `/opsx-continue <name>` - artifact 作成を継続
   - `/opsx-apply <name>` - tasks に沿って実装
   - `/opsx-verify <name>` - 実装と artifacts の整合を確認
   - `/opsx-sync <name>` - delta specs を main specs に同期
   - `/opsx-archive <name>` - 完了した change を archive
   - `/opsx-explore <topic>` - 実装せずに調査・検討

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

| スクリプト               | 説明                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `pnpm dev:frontend`      | Vite 開発サーバーを起動（フロントエンド）                        |
| `pnpm dev:backend`       | Wrangler 開発サーバーを起動（バックエンド）                      |
| `pnpm dev:all`           | 両方のサーバーを同時に起動                                       |
| `pnpm build`             | フロントエンドとバックエンドの両方をビルド                       |
| `pnpm check`             | TypeScript 型チェックを実行                                      |
| `pnpm lint`              | ESLint、OpenSpec、サプライチェーン、Sentrux 構造品質ゲートを実行 |
| `pnpm lint:supply-chain` | pnpm のサプライチェーン防御設定を検証                            |
| `pnpm sentrux:check`     | Sentrux で循環依存と構造ルールを検査                             |
| `pnpm sentrux:gate:save` | AI 作業前の Sentrux 品質ベースラインを保存                       |
| `pnpm sentrux:gate`      | AI 作業後に Sentrux 品質劣化を検出                               |
| `pnpm format`            | Prettier でコードをフォーマット                                  |
| `pnpm migrate:generate`  | Drizzle マイグレーションを生成                                   |
| `pnpm migrate:studio`    | Drizzle Studio を開く                                            |
| `pnpm deploy`            | Cloudflare Workers にデプロイ                                    |

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

Cloudflare Deploy Button は、ユーザー自身の GitHub/GitLab account に repository を複製し、Workers Builds で `package.json` の `deploy` script を実行します。このテンプレートでは `pnpm build && wrangler deploy --env production` が使われ、`wrangler.toml` の production 設定にある D1 database、KV namespace、R2 bucket は Cloudflare の resource provisioning 対象になります。

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

4. **デプロイ:**

   ```bash
   pnpm deploy
   ```

5. **本番環境リソースをセットアップ:**
   - 本番環境の D1 データベース、KV 名前空間、R2 バケットを作成
   - `wrangler.toml` の `[env.production]` セクションを更新
   - 本番環境データベースにマイグレーションを適用

### 環境変数

本番環境の場合、Wrangler を使用して環境変数を設定します：

```bash
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_DATABASE_ID
wrangler secret put CLOUDFLARE_D1_TOKEN
```

## OpenSpec による仕様駆動開発

このテンプレートには、OpenSpec の運用をサポートするディレクトリ構造が含まれています。

### OpenSpec とは

OpenSpec は仕様駆動開発（Spec-Driven Development）のためのワークフローです。change（変更単位）に proposal/specs/design/tasks を揃え、AI コーディングアシスタントと協力して、要件定義から実装まで段階的に進めます。

### 基本の開発プロセス

1. **Proposal**: 目的/非ゴール/成功条件を固める
2. **Specs**: 仕様（要求・受け入れ条件）を文書化する
3. **Design**: 実装方針・設計を固める
4. **Tasks**: 実装可能なタスクに分解する
5. **Apply**: tasks に沿って実装する

### プロジェクトの初期化

```bash
openspec init
```

### スラッシュコマンド

OpenCode で以下のコマンドが使えます：

- **`/opsx-new <name>`** - change を作成して artifact 作成を開始
- **`/opsx-continue <name>`** - 次の artifact を作成
- **`/opsx-apply <name>`** - tasks に沿って実装
- **`/opsx-archive <name>`** - change を archive

### 使用例

```
# OpenCode 内で実行
/opsx-new add-user-auth
/opsx-continue add-user-auth
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

## Sentrux - アーキテクチャ品質ゲート

このテンプレートには、AI 支援開発でコード構造が劣化したことを検出するための Sentrux が設定されています。Dev Container と CI は Sentrux の GitHub Releases latest を導入し、`pnpm lint` の中で `sentrux check packages` を実行します。OpenCode スキル、ルート設定、運用 scripts は対象外にし、アプリ本体の `packages/` だけを構造品質ゲートとして監視します。

### 使い方

```bash
# 構造品質ゲートを単独で実行
pnpm sentrux:check

# AI エージェント作業前にベースラインを保存
pnpm sentrux:gate:save

# AI エージェント作業後に品質劣化を検出
pnpm sentrux:gate
```

### OpenCode MCP

OpenCode では `.opencode/opencode.json` に `sentrux --mcp` が登録されています。設定変更後は OpenCode を再起動すると、Sentrux MCP の `scan`、`health`、`session_start`、`session_end` などを利用できます。

### 設定ファイル

- **`packages/.sentrux/rules.toml`**: `packages/` 配下の循環依存、複雑度、関数行数、主要レイヤー境界の構造ルール
- **`.devcontainer/scripts/install-applications.sh`**: Dev Container postCreate で各CLI導入スクリプトを順番に実行する処理
- **`.devcontainer/scripts/install-*.sh`**: Wrangler、OpenCode、Serena、OpenSpec、Sentrux、agent-browser の個別インストール処理

## カスタマイズ

### Material UI テーマ

`packages/frontend/src/ui/theme.ts` でテーマをカスタマイズ：

```typescript
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#64b5f6',
      dark: '#0d47a1',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export const theme = responsiveFontSizes(baseTheme);
```

### 新しいルートの追加

1. `packages/frontend/src/app/pages/` にページコンポーネントを作成
2. `packages/frontend/src/app/router.tsx` にルートを追加

### 新しい API ルートの追加

1. `packages/backend/src/http/routes/` にルートハンドラーを作成
2. `packages/backend/src/http/routes/index.ts` にルートを登録

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
- JSON/Markdown ファイル: Prettier フォーマット

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
- [Material UI ドキュメント](https://mui.com/)
- [TanStack Query ドキュメント](https://tanstack.com/query/latest)
- [OpenSpec](https://github.com/fission-ai/openspec)
