# プロダクト概要

このテンプレートは、要求と利用体験を OpenDesign で具体化し、計画完了した OpenSpec の変更を OpenCode で製品へ実装する開発環境です。生成先では、この概要を実際の利用者、状況、期待する価値に合わせて育てます。

## 現在のサンプル

ホームからユーザー管理へ移動し、名前とメールアドレスでユーザーを作成して一覧で確認する体験を用意しています。

- 統合プロトタイプのソース: `mockups/src/App.tsx`、起動処理: `mockups/src/main.tsx`
- ホーム: `mockups/index.html?scenario=default#/`
- ユーザー管理: `mockups/index.html?scenario=default#/users`
- 状態の選択: `scenario` に `empty-users`、`users-loading`、`users-error`、`create-error` を指定
- デザインシステム: `@cfreact-template/ui` の公開サブパス
- 表示と操作: エージェントが `pnpm build:mockup` を実行し、OpenDesign の組み込みの `Prototype Preview` で `mockups/index.html` を静的成果物として開く

プロトタイプは固定データとローカル状態で体験を表します。本書は製品の背景を示す概要です。要求ごとの背景・動機・成果と所有者確認は `openspec/changes/<change-id>/request.md` に記録し、製品要件は確認済み成果と外部契約に基づきます。関連する画面と状態の参照は `UI Mock References` に記載します。
