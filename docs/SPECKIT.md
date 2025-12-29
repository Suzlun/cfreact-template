# Speckit 運用ガイド

このリポジトリでは、Spec Kit（spec-kit）のスラッシュコマンド群（`/speckit.*`）を使って、仕様作成 → 計画 → タスク化 → 実装までを段階的に進めます。成果物は `specs/` 配下に残り、実装と一緒にレビュー・運用できます。

## 前提

- **Python 3.11+ / uv**（Spec Kit の CLI 利用に必要）
- **Git**（推奨。ブランチ名から対象 feature を自動判定します）
- **Codex CLI**（本リポジトリでは `.codex/prompts/` に Speckit コマンドが定義されています）

Dev Container を使う場合は、これらは事前に入っている想定です。

## リポジトリ内の構成

- `specs/`
  - feature ごとの成果物置き場（例: `specs/001-user-auth/`）
  - 主に `spec.md / plan.md / tasks.md` と補助ドキュメントを配置
- `.codex/prompts/`
  - Codex CLI 用の Speckit コマンド定義（`speckit.specify` など）
- `.specify/`
  - テンプレート、スクリプト、メモリ（constitution）を格納
  - Bash スクリプトは `.specify/scripts/bash/` にあります

## 基本フロー

1. `/speckit.constitution`（プロジェクト原則の定義）
2. `/speckit.specify`（feature 仕様の作成）
3. `/speckit.clarify`（曖昧点の解消・仕様の確定）
4. `/speckit.plan`（技術計画・設計成果物の生成）
5. `/speckit.tasks`（実行可能なタスク分解）
6. `/speckit.analyze`（任意: ドキュメント間整合性の点検）
7. `/speckit.implement`（タスクを順に実装）

以降では、それぞれ「いつ」「何を入力し」「何が出力されるか」を中心にまとめます。

## `/speckit.constitution`

プロジェクト全体で守るルール（品質基準、設計方針、レビュー観点など）を定義します。

- 主な出力: `.specify/memory/constitution.md`
- 使いどころ:
  - 導入直後に作る（最初の 1 回が重要）
  - 大きく方針転換する時に更新する

例:

```text
/speckit.constitution コード品質とテスト方針、セキュリティと運用を重視する。依存方向は厳格に守り、仕様・計画・タスクは必ずリポジトリ内に残す。
```

## `/speckit.specify`

feature の仕様（何を・なぜ・どう成功とするか）を `specs/` 配下に作ります。Git がある場合は feature ブランチも作成します。

- 主な出力: `specs/<###-feature>/spec.md`
- 重要:
  - **入力は「要件（What/Why）」中心**で、実装方法（How）はここでは最小にする
  - ブランチ命名は `###-short-name` 形式（3 桁 + `-`）が前提

例:

```text
/speckit.specify ユーザーがメールアドレスとパスワードでサインアップ/ログインできる。ログイン後はプロフィール編集ができ、未ログインでは保護ページへアクセスできない。
```

## `/speckit.clarify`

`spec.md` の曖昧点を最大 5 問までの質問で潰し、回答を `spec.md` に反映します。

- 主な出力: `specs/<###-feature>/spec.md`（更新）
- 運用のコツ:
  - 迷う点は「後で決める」より、**選択肢を固定して決める**方が downstream の手戻りが減る
  - セキュリティ、権限、失敗時の挙動は優先して明確化する

例:

```text
/speckit.clarify セキュリティとエラー時の挙動にフォーカスして確認したい
```

## 仕様を増やす / 変更する

ここでは「仕様を足す」「仕様が変わる」場面で、どう動くと手戻りが少ないかを例で示します。

### 例 1: 仕様を増やす

仕様作成後に要件が増えた場合は、まず `spec.md` を更新します。変更が多い・判断が絡む場合は `/speckit.clarify` を使うと取りこぼしが減ります。

1. feature ブランチにいることを確認（例: `001-user-auth`）
2. 追加要件を渡して `/speckit.clarify` を実行

```text
/speckit.clarify 追加要件: パスワードを忘れた場合のリセット導線を追加したい。初期はメール送信ではなく画面上にトークンを表示する方式でよい。
```

3. 質問に回答して `spec.md` が更新されたら、次に `/speckit.plan` へ進む

### 例 2: 仕様変更

計画まで進んだ後に要件が変わった場合は、**まず spec → 次に plan → 最後に tasks** の順で揃えるのが安全です。

例: 「ログイン方法をメール+パスワードから SSO に変更したい」

1. `specs/<###-feature>/spec.md` を更新（`/speckit.clarify` で反映してもよい）
2. 計画を更新

```text
/speckit.plan 認証は組織の SSO（OIDC）を前提にする。ログイン UI は最小、まずは保護ルートとログアウトまで。
```

3. タスクを作り直す

```text
/speckit.tasks
```

4. 不安があれば `/speckit.analyze` で整合性チェックしてから実装へ進む

### 例 3: 仕様変更

`tasks.md` が進捗管理にも使われている場合は、単純に `tasks` を再生成するとチェック状態が消えることがあります。変更の大きさに応じて、次のどちらかを選びます。

#### パターン A: 小さめの変更

例: 「Users 一覧に並び替え条件を追加する」程度

1. `spec.md` を更新（必要なら `/speckit.clarify`）
2. 影響がある箇所だけ `plan.md` に追記（設計判断が変わるなら）
3. `tasks.md` は **既存タスクを残したまま**、末尾に追記する（次の連番 ID を採番）

追記例（最後が `T042` なら `T043` から）:

```text
- [ ] T043 [US?] Users 一覧の並び替え条件を仕様に合わせて実装（packages/client/app/src/pages/users/UsersPage.tsx）
```

#### パターン B: 大きめの変更

例: 「権限モデルを刷新する」「データ構造から変わる」など、既存のタスク列を大きく崩す変更

- いまの feature はいったん収束させ、別 feature として `/speckit.specify` から作り直すのが管理しやすいです
- 既存 feature に残す場合でも、`tasks.md` のやり直しが必要になることが多いので、差分レビューしやすい単位（PR）に分けて進めます

## `/speckit.plan`

仕様に基づいて、技術スタック・構成・設計成果物を `specs/<feature>/` に生成します。

- 主な出力:
  - `specs/<###-feature>/plan.md`
  - `specs/<###-feature>/research.md`（調査・意思決定ログ）
  - `specs/<###-feature>/data-model.md`
  - `specs/<###-feature>/contracts/`（API 契約）
  - `specs/<###-feature>/quickstart.md`（検証シナリオ）
- 補足:
  - plan 生成の起点には `.specify/scripts/bash/setup-plan.sh` が使われます
  - 必要に応じて `.specify/scripts/bash/update-agent-context.sh` がエージェント向けコンテキストを更新します

例:

```text
/speckit.plan Cloudflare Workers + Hono。データは D1、認証はセッション方式で、クライアントは React。まずは最小のログイン/ログアウトと保護ルートから始める。
```

## `/speckit.tasks`

`plan.md` を中心に、設計成果物を読み込んで `tasks.md` を生成します。タスクは実行順に ID 付けされ、並列可能なものは `[P]` が付与されます。

- 主な出力: `specs/<###-feature>/tasks.md`
- 運用のコツ:
  - `tasks.md` は実装の「台本」なので、変更が出たら早めに更新する
  - 大きな方針変更は `plan.md` 側を直してから `tasks` を作り直す

## `/speckit.analyze`

`spec.md / plan.md / tasks.md` の間の矛盾や抜けを **読み取り専用で**点検します。

- 出力: チャット上のレポート（ファイルは変更しない）
- 使いどころ:
  - 実装開始前の最終チェック
  - レビューで「仕様とタスクの対応が不安」になった時

## `/speckit.implement`

`tasks.md` に沿って実装を進めます。チェックリストがある場合は、未完了が残っていないかを最初に確認します。

- 前提: `specs/<###-feature>/tasks.md` が存在すること
- チェックリスト運用:
  - `specs/<###-feature>/checklists/` がある場合、配下のチェックボックスを集計して状態確認します

## ブランチと `specs/` の運用ルール

- feature ブランチは `###-short-name`（例: `001-user-auth`）
- Speckit は **ブランチの 3 桁 prefix** を使って `specs/` 配下の対象ディレクトリを解決します
  - 例: `004-fix-bug` / `004-add-feature` のように、同じ prefix の複数ブランチでも同じ `specs/004-*/` を参照します
  - prefix が同じディレクトリが複数あると判定が不安定になるため、**prefix ごとに `specs/` のディレクトリは 1 つ**にします

## Spec Kit の更新

上流（github/spec-kit）のテンプレート更新を取り込みたい場合は、手元の変更を考慮して更新します。

1. CLI の更新（必要なら）:
   - `uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git`
2. プロジェクトファイルの更新（テンプレート再適用）:
   - `specify init --here --force --ai codex`

注意:

- 上流の更新は `.specify/memory/constitution.md` を上書きする場合があります。更新前にバックアップするか、Git で復元できるようにしておきます。

## よくある詰まりどころ

- `Not on a feature branch` と出る
  - `###-...` 形式のブランチに切り替えてから実行します
- `plan.md not found` と出る
  - `/speckit.plan` を先に実行します
- `tasks.md not found` と出る
  - `/speckit.tasks` を先に実行します
