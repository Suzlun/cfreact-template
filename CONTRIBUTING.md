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
- Terraform 1.16
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
   export CORE_API_TOKEN="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))")"
   pnpm dev:backend    # main + core Workers (http://localhost:8787)
   pnpm dev:frontend   # React (http://localhost:5173)
   # または
   pnpm dev:all
   ```
3. 手動環境では agent-browser を導入
   ```bash
   sh .devcontainer/scripts/install-agent-browser.sh
   ```

## OpenDesign の利用準備

企画を始めるには、OpenDesign の実行環境、そこから実行できる OpenCode とモデル認証、対象リポジトリへの読み書き権限、会話・設定の永続保存先が必要です。次のいずれかを利用します。

- **Dev Container:** このテンプレートの `ai` サービスを使い、対象リポジトリを起動時に自動登録します。
- **共通環境:** 複数リポジトリで使う OpenDesign を別途用意し、それぞれのリポジトリを登録します。構成ファイル、データ保存先、接続 URL、認証の共有範囲は利用環境ごとに決めます。

新規プロダクトは GitHub の `Use this template` からリポジトリを作成し、利用する環境へクローンします。既存リポジトリなら、そのチェックアウトを使用します。OpenDesign への登録後、ホームのプロジェクト一覧から開き、下記「OpenDesign で始める」の手順で要求と React モックを育てます。

OpenDesign のプロジェクトはリポジトリを扱う作業場所です。企画の中で成果ごとに作成する OpenSpec Change とは別の単位です。

共有プロジェクトスキルは `.agents/skills/` に置きます。OpenCode のプロジェクト向け Agent Skills 互換検出を使い、OpenDesign 内の OpenCode も同じリポジトリルートから読み込みます。エージェント定義は `.opencode/agents/`、コマンド定義は `.opencode/commands/` に置きます。

### 共通の OpenDesign 環境

Docker で共通環境を構築する場合は、[公式の Docker 導入手順](https://github.com/nexu-io/open-design/blob/open-design-v0.21.1/deploy/README.md)に従い、OpenDesign が OpenCode を実行できるようにします。対象リポジトリをマウントし、コンテナ側で見える絶対パスと読み書き権限を確認します。永続データはプロダクトのリポジトリとは別の管理領域に置きます。

まず登録済みプロジェクトを確認し、対象パスが未登録の場合だけフォルダーを登録します。以下の値は、その環境の構成に置き換えます。

```bash
docker compose -f "<共通環境のComposeファイル>" exec -T "<AIサービス名>" \
  node apps/daemon/dist/cli.js project list --json

docker compose -f "<共通環境のComposeファイル>" exec -T "<AIサービス名>" \
  node apps/daemon/dist/cli.js project import-folder \
  "<コンテナ側のリポジトリ絶対パス>" --name "<プロジェクト名>"
```

登録後は OpenDesign のホームからプロジェクトを開き、実際の作業場所と `AGENTS.md`、リポジトリ内スキル、`mockups/src/App.tsx` の参照を確認します。モデルの接続テストを行い、エージェントがリポジトリで `pnpm build:mockup` を実行できることを確認します。Node.js と依存関係はこのビルド環境に用意します。生成後、OpenDesign の組み込みの `Prototype Preview` で `mockups/index.html` を通常の静的成果物として開いてから企画を始めます。

### Dev Container の OpenDesign

VS Code の「Dev Containers: Rebuild and Reopen in Container」で、`.devcontainer/compose.yaml` の `ai` と `dev` が起動します。`ai` には OpenDesign と、それが実行する OpenCode を同居させています。どちらも対象リポジトリを `/workspaces/project` として使用します。コンテナ名は Compose のプロジェクト名を含む `<project>-ai-1` になり、複数リポジトリを同時に開けます。

`ai` の正常起動後に `dev` を起動し、開始処理で対象ワークスペースを OpenDesign へ登録します。再起動時は登録済みのものを使います。VS Code のポート一覧から `AI / OpenDesign`（7456）を開き、ホームのプロジェクト一覧から対象リポジトリを選択してください。初回は開発コンテナのターミナルで `opencode auth login` を実行し、モデル提供元へのログインを済ませ、OpenDesign の `Local Agent` で `OpenCode` を選びます。コンテナ専用の OpenCode 設定・認証・実行状態は、同じ Compose プロジェクト内の両コンテナで共有されます。

保存先は `.devcontainer/.volumes/` です。`open-design/` に会話・プロジェクト情報、`opencode-config/`、`opencode-data/`、`opencode-state/` に両コンテナで共有する OpenCode の設定・認証・実行状態を保存します。起動前にホスト側で作成し、Compose からマウントします。Git 管理と Docker のビルド対象から除外しており、コンテナ再作成後も保持されます。共通の OpenDesign 環境とは独立しています。ワークスペースの登録先は `/workspaces/project` です。React モックはエージェントが同じリポジトリでビルドし、`mockups/index.html` を OpenDesign の組み込みの `Prototype Preview` で開きます。

ホストですでに7456を使用している場合や複数の Dev Container を開く場合、VS Code が別のローカルポートへ転送します。ポート一覧に表示される実際のアドレスを使用してください。

開発コンテナ固有の設定は `.devcontainer/.volumes/dev-config/` に保存し、その中の OpenCode 設定だけを共有先へマウントします。

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
- アプリケーション版へ影響する`apps/**`、`packages/**`、root manifest、lockfileの変更には通常Changesetまたはempty Changesetを1つ追加する
- template workflow、release tooling、文書だけの保守にはpending Changesetを追加しない
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
  - 例: `apps/main/typespec/openapi/openapi.json`、`apps/main/src/backend/generated/**`、`apps/main/src/backend/modules/*/handlers/**` の `Orval` 前置き、`apps/main/src/frontend/api/generated/**`
- 振る舞い契約が変わる変更は仕様と必要な試験を一緒に更新する
  - Playwright E2E試験だけが題名から既存Scenarioを`[...-S001]`の形式で参照する
  - Scenarioごとの自動試験は要求せず、純粋な単体試験、Reactの顧客向けUI試験、Storybookブラウザ試験はScenario識別子を参照しない
  - Playwright E2E、純粋で決定的な単体試験、Reactの顧客向けUI試験、Storybookブラウザ試験だけを使用する
  - Reactの顧客向けUI試験では、利用者に見える描画と操作を保全する目的でjsdom、MSW、Testing Libraryを利用できる
  - Workerd固有、実データベース、接続、バックエンドHTTP・OpenAPI契約、ファイルシステム・子プロセスを使うツール自己試験を作らない
  - 試験専用の製品側API、公開要素、生成処理、分岐、Binding、設定を作らない
- プロダクトの方向付けは OpenDesign から始め、要求確認と計画成果物の作成を進める
- `Request-Status: CONFIRMED` は `request.md` の現在の保存内容がすべて確認済みであることを示す。明確で明示的な所有者の発言は確認証拠として即時反映し、意味や拘束力が曖昧な場合だけ再確認する
- OpenSpec の仕様を観測可能な振る舞いの正とし、確認済み要求を意味の根拠にする。重要な手段は設計へ、実装成果は粗い作業パッケージへ記録する

## 変更運用

変更を始める前に、`docs/change-operation.md` に従って三軸を独立に決めます。

| 軸               | 値                                     | 判断内容                           |
| ---------------- | -------------------------------------- | ---------------------------------- |
| `Operation Lane` | `DIRECT` / `BEHAVIOR` / `ARCHITECTURE` | 振る舞い・構造をどの運用で扱うか   |
| `UX Mode`        | `NONE` / `CONTINUITY` / `SHAPE`        | 利用者に見える体験をどう扱うか     |
| `Review Depth`   | `STANDARD` / `DEEP`                    | 独立レビューをどの深さで実施するか |

- `DIRECT`: 観測可能な振る舞いも重要な内部構造も変えない作業です。OpenSpec の変更は不要です。本テンプレート自身の保守でサンプルの振る舞いを維持する作業も該当し、未リリースの Changeset を追加しません。
- `BEHAVIOR`: 観測可能な振る舞いを変更する作業です。`behavior-change` の変更が必要です。
- `ARCHITECTURE`: 重要な内部構造を変更する作業です。`architecture-change` の変更が必要です。
- `architecture-change` で観測可能な振る舞いを維持する場合は `.openspec.yaml` に `skip_specs: true` を設定します。
- `NONE` はモック不要、`CONTINUITY` は既存製品の証拠に従い、`SHAPE` は OpenDesign で要求とモックを同時に具体化します。
- `SHAPE` の提案は、確認済み要求と所有者が受け入れたモックが揃い、相互に過不足なく対応し、採用理由が説明でき、矛盾がない状態で収束させます。`proposal.md` の `Design Source` に OpenCode が読めるパスまたは安定した識別子、画面・操作の流れ・状態の範囲、受け入れと採用理由を記録します。
- 実際の UI 変更にはプロダクトデザイナーの関与と、デスクトップ・モバイル双方の実ブラウザ確認が必要です。
- `STANDARD` を既定とします。`DEEP` は所有者の明示要求、または確認済み成果や外部契約に不可欠な一つの未解決の問いを通常レビューで解消できない場合に選びます。

OpenSpec `1.11.0` を使用します。変更は `BEHAVIOR` なら `pnpm exec openspec new change <change-id> --schema behavior-change`、`ARCHITECTURE` なら `pnpm exec openspec new change <change-id> --schema architecture-change` で作成します。`pnpm gen:openspec` は `new`、`continue`、`update`、`apply`、`verify`、`sync`、`archive` のカスタムプロファイルでスキルとコマンドを再生成し、生成物は手編集しません。

OpenDesign が全計画成果物を担当し、OpenCode と利用者が選択した `openspec/applier` は計画完了した変更だけを実装します。実装側が編集できる計画ファイルは `tasks.md` の進捗だけです。製品判断の不足や計画間の矛盾があれば `OPENDESIGN_PLANNING_REQUIRED` を返し、OpenDesign で解決します。

### OpenDesign で始める

ルートの `mockups/` に一つの統合 React プロトタイプを置きます。正となるソースは `mockups/src/**` で、`App.tsx` が画面構成、`main.tsx` が起動処理です。エージェントが `pnpm build:mockup` を実行し、OpenDesign の組み込みの `Prototype Preview` で `mockups/index.html` を静的成果物として開きます。

OpenDesign でプロジェクトを開き、`Design Files` の `Pages` にある `mockups/index.html` をダブルクリックして `Preview` を表示します。表示幅は `Preview viewport` で切り替えます。ソースを編集して再ビルドした後は `Reload Preview` で確認します。

ホームは `mockups/index.html?scenario=default#/`、ユーザー管理は `mockups/index.html?scenario=default#/users` です。`scenario` に `empty-users`、`users-loading`、`users-error`、`create-error` を指定すると対象の状態を確認できます。デスクトップとモバイルの表示幅で、固定データとローカル状態による作成・重複メールの修正・一覧取得失敗からの復旧を操作します。共通実装は `@cfreact-template/ui` の公開サブパスから直接利用します。共通 UI のカタログは `pnpm storybook` の `UI` です。

Vite は既存の共通 UI の Tailwind CSS 4 と React Compiler 設定を使い、単一の IIFE `mockups/dist/prototype.js` と `mockups/dist/prototype.css` を生成します。安定した `mockups/index.html` は両ファイルを `./dist` から相対参照します。`dist` は Git 管理し、ソース変更時に再生成して、手編集はしません。詳しい編集規則は `mockups/AGENTS.md` を参照してください。

1. [OpenDesign](https://github.com/nexu-io/open-design) で生成先リポジトリを作業場所にし、実行環境に OpenCode を選びます。最初に `AGENTS.md`、`openspec/config.yaml`、`.agents/skills/openspec-new-change/SKILL.md` を読めることと、実際の作業場所が対象リポジトリであることを確認します。
2. OpenDesign では `PRODUCT.md`、`mockups/src/**`、`openspec/changes/**` を編集し、ビルドした静的成果物で体験を確認します。既存画面を変える場合はその画面を、新規プロダクトの場合は企画書と主な利用の流れを入力します。`PRODUCT.md` は背景を示す概要であり、製品要件の根拠は確認済みの要求に置きます。
3. 次の入力ひな形で、要求確認とモック作成を同時に始めます。わかっている情報を伝え、未確定な点は対話で解決します。

```text
このリポジトリの開発運用に従い、OpenDesign で企画を進めてください。
AGENTS.md、docs/change-operation.md、openspec/config.yaml を読んでください。

利用者と現在の状況: <わかっている内容>
変更したい理由と期待する成果: <わかっている内容>
既存画面または企画書: <参照先または説明>

要求確認と mockups/src/App.tsx を中心とした統合Reactモック作成を同時に進めてください。
共通UIの公開サブパスから実装を直接利用し、固定データとローカル状態で体験を表してください。
エージェントが pnpm build:mockup を実行し、mockups/index.html を組み込みの Prototype Preview で静的成果物として開いてください。
所有者が確認した内容は request.md へ随時保存し、モックとの対応を見直してください。
関連する画面と状態を mockups/index.html?scenario=default#/ などの形式で UI Mock References に記録してください。
独立した成果を説明できた段階で、該当スキーマを指定して変更のひな形を作成してください。
所有者がモックを採用し、要求との整合が取れたら計画成果物を完成させてください。
計画完了した変更を OpenCode に引き渡すところまでを担当してください。
```

OpenDesign 内の OpenCode は企画を進める実行環境です。企画中は `openspec-new-change` と `openspec-continue-change` を使い、下流成果物を伴う計画修正には `openspec-update-change` を使います。モックを変更するたびに理由と要求を、要求を変更するたびにモックを照合します。

### モックを引き渡す

要求の `UI Mock References` から、`mockups/index.html?scenario=default#/` や `mockups/index.html?scenario=users-error#/users` などの実在する画面・状態へ参照を張ります。一つの画面・状態は複数の変更に、一つの変更は複数の画面・状態に対応できます。共有部分の更新時は関係する要求を再評価し、変更のアーカイブ後もルートの `mockups/` を保持します。OpenCode は同じリポジトリの `mockups/src/**` と対象の静的成果物を照合します。

両スキーマの提案ひな形にある `Design Source` へ、実際の情報を記入します。

```markdown
### Design Source

- 採用済み観点: <要求と同じ mockups/index.html?scenario=default#/ などの画面・状態の参照>
- 対象範囲: <この変更に関係する画面、操作の流れ、状態>
- 採用の証跡: <実際の所有者発言と、その発言が対象とするモック>
```

`pnpm lint:openspec` で構造を検証し、要求・仕様・モックの意味と所有者の採用を照合して計画完了を判断します。その後、同じリポジトリで OpenCode の `openspec/applier` を選び、「`<change-id>` を実装して」と依頼します。`/opsx-apply <change-id>` でも開始できます。

参照できないモックや計画間の矛盾が見つかった場合は、OpenDesign で対象の要求・モック・下流成果物を更新し、再び計画完了を確認してから同じ変更の実装を再開します。

### 実装と確認

UI は `PRODUCTION_UI -> WIRING -> POLISH -> REVIEW` の順に進めます。承認済み React モックの構成、階層、操作、画面遷移、文言、状態、画面幅への対応、視覚表現を、`apps/main` と `packages/ui` へ正式に実装します。製品コードは `mockups/` をインポートせず、本番状態の補完は確認済み契約から導ける必要なものに限定します。

新規プロダクトは OpenDesign で利用の流れ全体とモックを形にし、顧客成果ごとの複数の変更へ分けます。共有判断の更新時は影響する変更を再評価し、独立して計画完了したまとまりから引き渡します。概念上の段階と引き渡し条件は `docs/change-operation.md` を参照してください。

OpenSpec の `tasks.md` は粗い作業パッケージ台帳です。ファイル、補助処理、試験階層の詳細は、現在の作業パッケージと検証結果に基づき実装時に段階的に決めます。

`architecture-change` の `design.md` は、存在する全差分仕様単位を汎用能力へ分解し、`Reuse Assessment` に再利用元分類、採用判断、対象と版、対象能力を調査範囲に含む最新の調査報告を記載します。`skip_specs: true` の場合は、重要な設計判断に必要な再利用根拠だけを記録します。推移依存と対象パッケージでの直接採用は区別します。`pnpm lint:openspec` は仕様単位の記載漏れ、分類値、調査報告の実在を検査します。

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
- `pnpm lint:ui-reuse` は UI catalog の整合と `packages/ui` / `apps/main/src/frontend/app` 間のコード clone を検査します。

## 自動生成

### API

公開main APIの正は`apps/main/typespec/main.tsp`、内部core APIの正は`packages/core/typespec/main.tsp`です。core契約のBearer認証もTypeSpecへ定義し、core SDKへ実行時の基底URL、トークン、標準`fetch`を注入します。変更後は両Honoサーバー、frontend SDK、core SDKを一括再生成してください。

```bash
pnpm gen:api-sdk
```

内部の生成段階だけを確認する場合は、次を使えます。

```bash
pnpm gen:openapi
pnpm gen:backend
pnpm gen:core
```

`openapi-typescript`と`Orval`はmainとcoreの生成サーバー、スマートハンドラー、`apps/main/src/frontend/api/generated/client.ts`、`packages/core-sdk/src/generated/client.ts`を所有します。スマートハンドラーでは生成前置きを変更せず、関数本体だけを実装します。

生成後は `pnpm check:codegen` を実行してください。このコマンドは OpenAPI のリソース `tag` と `operationId` に対応するハンドラーの不足、余分、生成リソースの残骸を検出します。続いて現在の生成物と全ハンドラーディレクトリを動的に列挙し、`git ls-files --cached -z` でステージ済み追加を受理しながら未追跡ファイルを拒否した後、生成差分を検出します。

mainとcoreの依存方向は次のとおりです。

```text
mainの単純な公開変換: entry -> app -> generated route -> Handler -> core-sdk
main固有ユースケース: entry -> app -> generated route -> Handler -> Service -> core-sdk / 外部クライアント
core HTTP境界: entry -> app -> generated route -> Handler -> Service
core永続化: Service -> Repository -> Schema / Platform
```

coreの`Service`がドメイン操作、不変条件、状態遷移、副作用調整を所有します。mainはcore実装、`Repository`、Schema、D1へ直接依存しません。`apps/main/tsconfig.backend.json`と`packages/core/tsconfig.json`を個別に型検査します。

各`apps/*`は想定利用者、状況、目的、成果で識別されるユースケースを所有し、core APIはそれらが利用するドメイン操作と問い合わせを提供します。想定利用者が異なれば別ユースケースです。すべてが同じユースケースを複数アプリへ置く場合はアプリ分割の必要を確認しますが、分割が確認済み要望なら維持します。重複だけを理由にユースケースをcoreへ移しません。

main固有の複合ユースケースはmainの`Service`へ置き、`@cfreact-template/core-sdk`または宣言済み外部クライアントだけを利用します。単純な公開変換は`Handler`からcore SDKを直接呼びます。core内の別リソースを利用する場合は公開`index.ts`を使い、`Repository`構築用のcomposition別名はcoreの`app`だけが利用します。ハンドラーは`env`を直接参照しません。

予測して処理する失敗は `Result` で返し、ハンドラーでは内部原因を含まない `{ code, message }` へ変換します。生成された応答検証処理には `guardResponseValidation` を先行させ、不安全な検証詳細は `app.onError` が記録して固定の 500 応答へ変換します。ユーザー作成の成功応答は生成スキーマで解析し、メールアドレス重複はデータベースの一意制約の結果で判定して 409 応答へ変換します。データベースのエラー文は解析しません。

### DB

スキーマを変更したらマイグレーションを生成してください。

`users` テーブルは `packages/core/src/modules/users/users.schema.ts` が所有します。既存の `packages/core/drizzle/migrations/0000_daily_dorian_gray.sql` を置き換えたり履歴を開始し直したりせず、同じマイグレーションストリームへ差分を追加します。

```bash
pnpm migrate:generate
```

ローカル適用は`pnpm migrate:apply`、production適用はDeploy Workflowの`wrangler d1 migrations apply`を使います。

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
pnpm test:run        # React/UI試験と純粋なSDK・業務・リリース規則試験
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
- TerraformがD1、KV、R2を所有し、Deploy Workflowはremote stateのoutputから一時Wrangler設定を生成します。
- Deploy Workflowはmigration、core、mainの順に処理します。手動再配備では`.release/deploy-targets.json`の対象だけを指定できます。
- `production` EnvironmentにはCloudflare認証情報、HCP Terraformトークン、バックエンド設定、256ビット以上のランダムな`CORE_API_TOKEN`を登録します。
- Cloudflare Email Routingの送信元・宛先検証はdashboardで完了してください。

不明点があれば Issue/PR で相談してください。
