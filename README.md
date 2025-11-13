# cfreact-template

**Cloudflare Workers** 上で React、Hono、Drizzle ORM を使用した本番環境対応アプリケーションを構築するためのフルスタックテンプレート。

## 技術スタック

### フロントエンド

- **React** 19.0.0 - React Compiler サポート付き UI ライブラリ
- **Vite** 7.2.2 - ビルドツール
- **React Router** 7.9.5 - ルーティング
- **TanStack Query** 5.90.7 - データフェッチとキャッシング
- **Chakra UI** 3.28.1 - コンポーネントライブラリ
- **TypeScript** 5.9+ - 型安全性

### バックエンド

- **Hono** 4.10.5 - 高速で軽量な Web フレームワーク
- **Drizzle ORM** 0.44.7 - D1 用の型安全 ORM
- **Cloudflare Workers** - サーバーレスランタイム
- **Cloudflare D1** - SQLite データベース
- **Cloudflare KV** - キーバリューストレージ
- **Cloudflare R2** - オブジェクトストレージ

### 開発環境

- **pnpm** 10.22+ - 高速で効率的なパッケージマネージャー
- **Node.js** 24.11.0 LTS - 開発ツール用ランタイム
- **Wrangler** 4.0+ - Cloudflare CLI
- **ESLint** 9.39+ - リンティング（flat config）
- **Prettier** 3.6.2 - コードフォーマット
- **Dev Containers** - 一貫した開発環境

## プロジェクト構成

```
cfreact-template/
├── packages/
│   ├── client/               # React フロントエンド（Vite）
│   │   ├── src/
│   │   │   ├── main.tsx      # エントリーポイント
│   │   │   ├── app.tsx       # プロバイダー付きアプリ
│   │   │   ├── router.tsx    # ルート定義
│   │   │   ├── lib/          # API クライアント
│   │   │   ├── pages/        # ページコンポーネント
│   │   │   └── components/   # 再利用可能なコンポーネント
│   │   └── package.json
│   ├── server/               # Cloudflare Workers バックエンド（Hono）
│   │   ├── src/
│   │   │   ├── index.ts      # メイン Hono アプリ
│   │   │   ├── types.ts      # Bindings 型定義
│   │   │   └── routes/       # API ルートハンドラー
│   │   └── package.json
│   ├── drizzle/              # Drizzle ORM スキーマ
│   │   └── src/
│   │       └── schema.ts     # D1 テーブル定義
│   └── ui/                   # Chakra UI テーマ
│       └── src/
│           └── theme.ts      # カスタムテーマ設定
├── drizzle/
│   └── migrations/           # データベースマイグレーション
├── spec/
│   └── api/                  # API 仕様
│       ├── hello.md
│       └── users.md
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

- **Node.js** 24.11.0 以降
- **pnpm** 10.22.0 以降
- **Cloudflare アカウント**（デプロイ用）

## セットアップ

### 方法 1: Dev Container を使用（推奨）

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
   pnpm dev:server  # バックエンド http://localhost:8787
   pnpm dev:client  # フロントエンド http://localhost:5173
   ```

8. **アプリケーションにアクセス:**
   - フロントエンド: http://localhost:5173
   - バックエンド API: http://localhost:8787/api
   - Drizzle Studio: `pnpm migrate:studio`

### 方法 2: 手動セットアップ（Dev Container なし）

**前提条件:**

- Node.js 24.11.0 以降
- Python 3.x（speckit 用）

1. **依存関係をインストール:**

   ```bash
   corepack enable
   pnpm install
   ```

2. **Wrangler をグローバルインストール:**

   ```bash
   npm install -g wrangler@4
   ```

3. **uv をインストール（speckit 用）:**

   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Windows
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

4. **Codex CLI をインストール（オプション、AI 支援開発用）:**

   ```bash
   npm install -g @openai/codex
   ```

5. 方法 1 のステップ 4-8 に従ってください。

**注意:** Dev Container には、これらすべてのツールがプリインストールされています（Node.js 24、Python 3、pnpm、Wrangler、uv、Codex CLI）。

### Codex CLI セットアップ（オプション）

AI 支援開発に Codex CLI を使用する場合：

1. **OpenAI API キーを取得:**
   - ChatGPT Plus/Pro/Business に登録するか、OpenAI API キーを取得
   - https://platform.openai.com/api-keys にアクセス

2. **Codex を設定:**

   ```bash
   codex auth
   ```

3. **speckit と一緒に使用:**
   ```bash
   # Codex でプロジェクトを初期化
   specify init my-feature --ai codex
   ```

## 開発ワークフロー

### 開発サーバーの起動

テンプレートは Vite のプロキシを使用して、フロントエンドからの `/api` リクエストを Workers 開発サーバーに転送します。

```bash
# ターミナル 1: Workers バックエンドを起動
pnpm dev:server

# ターミナル 2: React フロントエンドを起動
pnpm dev:client

# または両方を同時に起動
pnpm dev:all
```

### 利用可能なスクリプト

| スクリプト              | 説明                                        |
| ----------------------- | ------------------------------------------- |
| `pnpm dev:client`       | Vite 開発サーバーを起動（フロントエンド）   |
| `pnpm dev:server`       | Wrangler 開発サーバーを起動（バックエンド） |
| `pnpm dev:all`          | 両方のサーバーを同時に起動                  |
| `pnpm build`            | フロントエンドとバックエンドの両方をビルド  |
| `pnpm check`            | TypeScript 型チェックを実行                 |
| `pnpm lint`             | ESLint ですべてのファイルをリント           |
| `pnpm format`           | Prettier でコードをフォーマット             |
| `pnpm migrate:generate` | Drizzle マイグレーションを生成              |
| `pnpm migrate:studio`   | Drizzle Studio を開く                       |
| `pnpm deploy`           | Cloudflare Workers にデプロイ               |

### データベースマイグレーション

このテンプレートは、データベースマイグレーションに Drizzle Kit を使用します。

1. **スキーマを変更:**
   - `packages/drizzle/src/schema.ts` を編集

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

- `GET /api/hello` - シンプルなヘルスチェック

### Users（D1 データベース）

- `GET /api/users` - すべてのユーザーを一覧表示
- `POST /api/users` - 新しいユーザーを作成
- `GET /api/users/:id` - ID でユーザーを取得

### KV デモ

- `GET /api/kv/:key` - KV から値を取得
- `POST /api/kv` - キーバリューペアを保存
- `DELETE /api/kv/:key` - キーを削除

### R2 デモ

- `GET /api/r2/:key` - R2 からオブジェクトをダウンロード
- `POST /api/r2` - R2 にファイルをアップロード（multipart/form-data）
- `DELETE /api/r2/:key` - オブジェクトを削除

詳細な API 仕様は `spec/api/` を参照してください。

## デプロイ

### Cloudflare Workers にデプロイ

1. **Cloudflare にログイン:**

   ```bash
   wrangler login
   ```

2. **アプリケーションをビルド:**

   ```bash
   pnpm build
   ```

3. **デプロイ:**

   ```bash
   pnpm deploy
   ```

4. **本番環境リソースをセットアップ:**
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

## speckit による仕様駆動開発

このテンプレートには、API 仕様用の `spec/api/` ディレクトリが含まれています。

### speckit のインストール

```bash
# uv を使用（推奨）
uv tool install speckit

# または pip を使用
pip install speckit
```

### speckit の使用

```bash
# API 仕様を検証
speckit validate spec/api/

# 仕様から TypeScript 型を生成
speckit generate spec/api/ --lang typescript --out packages/drizzle/src/types.ts

# OpenAPI 仕様を生成
speckit bundle spec/api/ --format openapi --out openapi.yaml
```

詳細については、https://github.com/specify/speckit を参照してください。

## カスタマイズ

### Chakra UI テーマ

`packages/ui/src/theme.ts` でテーマをカスタマイズ：

```typescript
export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          // カスタムカラー
        },
      },
    },
  },
});
```

### 新しいルートの追加（フロントエンド）

1. `packages/client/src/pages/` にページコンポーネントを作成
2. `packages/client/src/router.tsx` にルートを追加

### 新しい API ルートの追加（バックエンド）

1. `packages/server/src/routes/` にルートハンドラーを作成
2. `packages/server/src/index.ts` にルートを登録

## コード品質

このテンプレートには、一貫したコード標準を維持するための自動コード品質ツールが含まれています。

### Git フック（Husky）

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

1. リポジトリをフォーク
2. フィーチャーブランチを作成
3. 変更を加える
4. `pnpm check` と `pnpm lint` を実行
5. プルリクエストを提出

## リソース

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Hono ドキュメント](https://hono.dev/)
- [Drizzle ORM ドキュメント](https://orm.drizzle.team/)
- [React ドキュメント](https://react.dev/)
- [Chakra UI ドキュメント](https://www.chakra-ui.com/)
- [TanStack Query ドキュメント](https://tanstack.com/query/latest)
- [speckit ドキュメント](https://github.com/specify/speckit)
