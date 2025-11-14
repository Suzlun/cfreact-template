# Codex エージェント設定

このディレクトリには、Codex CLI のエージェント設定やプロンプトを配置します。

## 使用方法

1. Dev Container を起動すると、このディレクトリが `~/.codex` にマウントされます
2. Codex CLI から参照される設定ファイルやエージェント定義をここに配置してください

## 注意事項

- APIキーや認証情報を含むファイル（config.json, .env など）は Git で追跡されません
- チームで共有すべき設定ファイル（このファイルなど）は Git にコミットできます

---

## インストール済み MCP サーバー

### Serena MCP Server

**概要**: セマンティックコード検索・編集を提供する強力なMCPサーバー。Language Server Protocol (LSP) を使用して、IDE並みのコード理解機能をLLMに提供します。

**機能**:

- セマンティックなコード検索（シンボルレベル）
- "Go to Definition" - 定義へのジャンプ
- "Find All References" - すべての参照を検索
- インテリジェントなコード編集
- シェルコマンド実行
- メモリ管理（コードベースのコンテキスト保持）

**対応言語**:

- 直接サポート: Python, TypeScript/JavaScript, PHP, Go, Rust, C/C++, Java
- 間接サポート: Ruby, C#, Kotlin, Dart など（合計30+言語）

**設定ファイル**:

- `config.toml` - Codex CLI の MCP サーバー設定
- `serena_config.yml` - Serena のグローバル設定
- プロジェクトルート `/.serena/project.yml` - プロジェクト固有設定

**Web ダッシュボード**:

- URL: `http://localhost:24282/dashboard`
- 機能: ログ表示、プロジェクト管理、統計情報

**使用例**:

```bash
# プロジェクトをアクティベート（初回のみ）
"Activate the current dir as project using serena"

# セマンティック検索
"Find all references to the User type using serena"
"Show me the definition of apiClient using serena"
"Find all usages of the createUser function using serena"

# コード編集（read_only: false の場合）
"Add a new field 'age' to the User interface using serena"
```

**セキュリティ設定**:

- デフォルトで `read_only: true`（読み取り専用モード）
- ファイル編集を有効にする場合は `.serena/project.yml` で `read_only: false` に変更

**トラブルシューティング**:

- Codex CLI では「failed」メッセージが表示されることがありますが、実際は成功していることが多いです（Codex のバグ）
- 初回起動時は言語サーバーのインストールで時間がかかる場合があります
- 大規模プロジェクトでは初回インデックス作成に数分かかることがあります

**リソース**:

- GitHub: https://github.com/oraios/serena
- ドキュメント: https://oraios.github.io/serena/
