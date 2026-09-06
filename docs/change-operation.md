# 変更運用

本書は、変更の進め方、OpenSpec の利用境界、UX 方針、レビュー深度を定める一次資料です。コーディング規則の機械的な強制内容は `CODING_STANDARDS.md`、開発者向け手順は `CONTRIBUTING.md` を参照してください。

## 基本原則

OpenDesign は、プロダクトの方向付けを始める正式な入口であり、所有者との要求確認と計画成果物を担当します。OpenSpec の仕様は観測可能な振る舞いの正であり、確認済みの要求をその意味の根拠とします。変更範囲と判断には `AGENTS.md` の Credo を適用します。

`request.md` は所有者が確認した要求の一次資料です。OpenDesign が確認済み内容を保存し、仕様、設計、作業パッケージへ意味に応じて分配します。OpenCode と利用者が選択する `openspec/applier` は、計画完了が確認された変更を実装します。

変更では、次の三つを独立に決めます。

1. `Operation Lane`: 変更をどの運用経路で進めるか。
2. `UX Mode`: 利用者に見える体験をどのように扱うか。
3. `Review Depth`: どの深さで独立レビューするか。

たとえば、内部構造を大きく変えながら画面体験を維持する変更は、`Operation Lane: ARCHITECTURE`、`UX Mode: CONTINUITY` です。運用区分から UX モードを推測してはいけません。

## Operation Lane

このリポジトリ自身の雛形、共通ツール、配備自動化を保守し、現在のサンプルアプリケーションの観測可能な振る舞いを維持する作業は `DIRECT` とします。このテンプレート保守では OpenSpec の変更を作成せず、未リリースの Changeset も追加しません。この扱いは本テンプレート自身に適用します。

### `DIRECT`

観測可能な振る舞いと重要なアーキテクチャ判断を変更しない作業です。文書の誤記修正、既存契約どおりに実装を直す局所的な不具合修正、生成や整形が該当します。

- OpenSpec の変更は不要です。
- プルリクエストの `OpenSpec Change` と `Scenario IDs` には、理由を添えた `なし` を記載できます。
- 作業中に振る舞いの変更または重要な構造判断が必要だと判明した場合は、実装を続ける前に `BEHAVIOR` または `ARCHITECTURE` へ変更します。

### `BEHAVIOR`

利用者、呼び出し元、運用上の外部契約から観測できる結果を追加、変更、削除、改名する作業です。

- `behavior-change` スキーマの OpenSpec の変更が必須です。
- `request.md`、`proposal.md`、差分仕様、`tasks.md` を使用します。
- 要件とシナリオには観測可能な成果を記載します。

### `ARCHITECTURE`

責務境界、依存方向、データ所有権、セキュリティ境界、移行、切り戻しなど、重要な内部構造を変更する作業です。

- `architecture-change` スキーマの OpenSpec の変更が必須です。
- `request.md`、`proposal.md`、`design.md`、`tasks.md` を使用します。
- 観測可能な振る舞いも変更する場合だけ差分仕様を使用し、構造変更後に成立すべき観測可能な結果を記載します。
- 観測可能な振る舞いを維持する場合は `.openspec.yaml` に `skip_specs: true` を設定します。
- `design.md` には重要な設計判断を記載します。

## UX Mode

### 統合プロトタイプ

同じリポジトリの `PRODUCT.md` にプロダクト全体の背景を示し、一つの統合 React プロトタイプをルートの `mockups/` に置きます。正となる React TypeScript ソースは `mockups/src/**`、中心となる画面構成は `mockups/src/App.tsx`、起動処理は `mockups/src/main.tsx` です。製品要件の根拠となる確認済み意図は各変更の `request.md`、実装契約は提案・仕様・設計・作業パッケージ、製品実装は `apps/main` と `packages/ui` が担います。

プロトタイプは `@cfreact-template/ui` の公開サブパスから共通実装を直接利用し、固定データとローカル状態で動作します。実際の API やデータベースには接続しません。OpenDesign は所有者に確認できた要求とソースを一緒に更新し、エージェントがリポジトリで `pnpm build:mockup` を実行します。Vite は既存の共通 UI の Tailwind CSS 4 と React Compiler 設定を使い、単一の IIFE `mockups/dist/prototype.js` と `mockups/dist/prototype.css` を生成します。`dist` は Git 管理し、ソース変更時に再生成します。生成物は手編集しません。

安定した入口 `mockups/index.html` は `./dist/prototype.js` と `./dist/prototype.css` を相対参照し、OpenDesign の組み込みの `Prototype Preview` で通常の静的成果物として開きます。Node.js とリポジトリの依存関係はエージェントのビルド環境が提供し、プレビューは生成済みファイルを表示します。既存 Storybook は共通 UI のカタログとして維持します。

現在のサンプルでは `#/` がホーム、`#/users` がユーザー管理です。クエリの `scenario` に `default`、`empty-users`、`users-loading`、`users-error`、`create-error` を指定して状態を選び、デスクトップとモバイルの表示幅で確認します。要求の `UI Mock References` には `mockups/index.html?scenario=default#/` や `mockups/index.html?scenario=users-error#/users` のように実在する画面と状態を記載します。複数の画面・状態と複数の変更は多対多で対応し、共有部分の変更では関係する要求を再評価します。`mockups/` は変更のアーカイブ後もリポジトリ直下に保持します。ソースの分割はこの一つのプロトタイプ内で必要な場合だけ行います。

UX モードは運用区分とは別に判定します。ただし、`SHAPE` は利用者に見える体験を実質的に変えるため、観測可能な振る舞いを変更しない `DIRECT` とは組み合わせません。

### `NONE`

利用者に見える画面、操作、文言、情報階層を維持する、UI 変更のない作業です。モックは不要です。OpenSpec の変更を使う場合は、その根拠を `proposal.md` の `## UI / UX Impact` に記載します。

### `CONTINUITY`

特定した既存の製品体験を維持します。`proposal.md` の `## UI / UX Impact` に `### Continuity Source` を置き、維持対象の実装済み画面、操作、状態などを参照できる証拠を記録します。

### `SHAPE`

OpenDesign で利用者に見える体験を形にします。要求とモックを相互に見直しながら同時に具体化し、所有者が確認した内容を随時保存します。提案の収束には、確認済みの要求と所有者が受け入れたモックが揃い、双方の内容が過不足なく対応し、採用理由を説明でき、矛盾がないことが必要です。

モックの中心作業、操作の優先順位、情報階層、画面遷移、初期動作、復旧方法、意味を持つ文言を変更するたびに、要求に理由があるかを確認します。新たな製品意図を所有者が明示した場合は、同時に `request.md` へ反映します。要求を利用者の体験に影響する形で更新した場合も、関連するモックを再評価し、必要な変更を反映してから進めます。余白や色などの表現上の詳細は、所有者が成果制約として拘束した場合を除き、デザインで扱います。

`proposal.md` の `## UI / UX Impact` に次を記録します。

- `### Primary User Task`: 利用者が完了したい中心作業。
- `### UX Direction`: 採用する体験の方向性。
- `### Design Source`: 要求の `UI Mock References` と同じ形式の採用済み画面・状態の参照、対応する画面・操作の流れ・状態の範囲、所有者による採用の短い証跡。実装側は対象の静的成果物と `mockups/src/**` の React ソースを照合します。

## UI の実装と実証

実際の UI 変更にはプロダクトデザイナーが関与します。実装は `PRODUCTION_UI -> WIRING -> POLISH -> REVIEW` の順で進めます。

1. `PRODUCTION_UI`: 承認済み React モック、または `CONTINUITY` の既存製品の証拠に従い、画面構成、情報階層、操作、画面遷移、文言、状態、画面幅への対応、視覚表現を忠実に実装します。モックの部品は `apps/main` と `packages/ui` へ正式に実装し、製品コードは `mockups/` をインポートしません。
2. `WIRING`: 確認済み契約に従ってデータと処理を接続します。
3. `POLISH`: 接続済み画面をブラウザで確認し、確認済み契約と採用済みデザインから導ける、本番利用に必要な状態だけを補完します。
4. `REVIEW`: 採用済みデザインとの一致を確認し、実ブラウザでデスクトップとモバイルの操作、表示、アクセシビリティを検証します。

製品判断の不足や計画成果物間の矛盾が判明した場合、実装側は `OPENDESIGN_PLANNING_REQUIRED` を返し、OpenDesign で解決してから実装を再開します。

仕様にある状態がモックに描かれていない場合は、確認済み契約の範囲で補完します。モックに明示された操作が仕様に明記されていなくても、要求に根拠があれば採用済みの操作を実装します。モックと要求・仕様が明示的に矛盾する場合、または採用済み体験がアーキテクチャやセキュリティの拘束条件と両立しない場合は、影響する作業を止めて差し戻します。

共通 UI は `packages/ui` を再利用し、採用済み体験を満たすために必要な拡張は `unit/frontend/designer` が担当します。画面幅に応じた補完は中心作業と情報階層を保存する範囲とし、操作の優先順位や画面遷移方式を変える判断は OpenDesign で解決します。レビューはピクセル単位の一致ではなく、構成、操作、文言、状態、優先順位、特徴的な視覚表現の保持を評価します。

プルリクエストでは、実際の UI / UX 変更がある場合に `Desktop Before`、`Desktop After`、`Mobile Before`、`Mobile After` の画像をすべて添付します。この要件は UX モードの選択とは別に、実際の変更内容から判定します。

## OpenSpec の計画

OpenSpec `1.11.0` を使用します。変更のひな形は、運用区分に対応するスキーマを指定して CLI から作成します。

```bash
pnpm exec openspec new change <change-id> --schema behavior-change
pnpm exec openspec new change <change-id> --schema architecture-change
```

`pnpm gen:openspec` は、`new`、`continue`、`update`、`apply`、`verify`、`sync`、`archive` を選んだカスタムプロファイルで、公式の `--tools agents` により共有スキル `.agents/skills/openspec-*/SKILL.md` を、`--tools opencode` によりコマンド `.opencode/commands/opsx-*.md` だけを生成します。生成物は再生成で更新します。手書きのリポジトリ固有の補足スキルは `.agents/skills/openspec/**` の入れ子構造を維持します。

`.agents/skills/` は OpenCode のプロジェクト向け Agent Skills 互換検出で読み込む共有スキルの配置先です。OpenDesign 内の OpenCode も同じリポジトリルートを使用します。エージェント定義は `.opencode/agents/`、コマンド定義は `.opencode/commands/` に置きます。

OpenDesign はリポジトリを作業場所にし、`PRODUCT.md`、`mockups/**`、`request.md`、`proposal.md`、仕様、`design.md`、`tasks.md` の作業範囲を所有します。`packages/ui` はモックから利用するデザインシステムです。生成スキルによる OpenSpec 操作にもこの担当境界を適用します。「実装して」という指示は計画完了後に OpenCode で行い、`openspec/applier` を使う場合は利用者がプライマリエージェントとして選択します。

### 要求確認と提案

OpenDesign は、利用者、現在の状況、変更動機、期待価値、望む成果のうち、判断に必要な未確認事項を一つずつ確認します。変更動機には困りごとや制約のほか、期待、機会、好奇心も含まれます。

`request.md` には `Request-Status: CONFIRMED` と、所有者が確認した背景、動機、要求、必要な成果制約や必須手段、確認証跡を保存します。この状態は「現在保存されている内容がすべて確認済み」を意味し、対話の進行に応じて更新できます。明確で明示的な所有者の発言自体が確認証拠となるため、その内容は即時反映します。意味または拘束力が曖昧な場合だけ再確認します。

成果物の意味に関わる選択が確認済み内容や権威ある証拠から導けない場合は、所有者へ焦点を絞って確認します。解決手段を示す入力は背景、動機、希望成果を確認したうえで、所有者が拘束したものを必須手段として設計へ記録します。背景と動機は要求の理由を説明し、製品要件の根拠は確認済み成果と外部契約に限定します。

`proposal.md` は確認済み要求を実現する変更提案です。観測可能な顧客価値と外部契約は仕様へ、重要な手段とアーキテクチャ判断は設計へ、実装成果のまとまりは作業パッケージへ記載します。成果物には確認済みの肯定的な成果、制約、実現に必要な採用内容だけを残します。

### 計画完了と引き渡し

`Planning Ready` は、製品判断、外部契約、重要な設計判断が解決済みで、計画成果物が整合し、UX モードに応じた証拠が揃った状態です。`SHAPE` では前述の要求とモックの収束条件も満たします。具体的なコード表現は、確認済み成果や外部契約がその表現を拘束する場合を除き、実装時に決めます。

新規プロダクトでは、OpenDesign が利用の流れ全体とモックを一体として具体化し、顧客成果ごとの複数の変更へ分けます。共有判断を更新した場合は影響する変更を再評価し、独立して計画完了したまとまりから実装へ引き渡します。

企画書は対話の入力として扱い、独立した成果を説明できる段階で変更のひな形を作成します。複数の `request.md` が一つの統合モックを参照できます。共有する識別、画面遷移、所有権、セキュリティ境界の未解決判断に依存する変更は、その解決後に引き渡します。

`IDEA -> CHANGE_SCAFFOLDED -> SHAPING -> PLANNING_READY -> IMPLEMENTING -> VERIFIED -> ARCHIVED` は、既存成果物と進捗で表す概念上の段階です。

OpenCode と `openspec/applier` は計画完了した変更だけを実装し、計画ファイルの編集は `tasks.md` の進捗に限定します。製品判断の不足や計画の矛盾は `OPENDESIGN_PLANNING_REQUIRED` として OpenDesign へ戻します。

### 永続的な振る舞い契約

主仕様は `openspec/specs/<capability>/spec.md`、進行中の差分仕様は `openspec/changes/<change-id>/specs/<capability>/spec.md` に置きます。

`skip_specs: true` の構造変更では、設計と作業パッケージで実装を進めます。確認済み要求に観測可能な変更が加わった場合は `skip_specs` を除去し、対応する差分仕様を作成します。

要件とシナリオは、確認済み要求に基づく、利用者または外部契約から観測可能な肯定的成果を表します。所有者が求めた体験そのものを表す UI 構成や配置は成果制約として扱い、内部コンポーネント構造などの手段は設計で扱います。

廃止する要件は `REMOVED Requirements` で除去します。認可や秘密非開示も、認可された主体または公開可能な情報についての肯定的な保証として定義し、拒否時の結果を含むシナリオで観測します。

### 再利用を優先する設計

OpenDesign は `architecture-change` の各差分仕様単位について、パッケージで代替可能な汎用能力ごとに再利用を判断します。既存コード、標準ライブラリ、実行基盤の標準機能、実績ある外部パッケージを優先し、セキュリティ、サプライチェーン、アーキテクチャの規則を適用します。

`skip_specs: true` の場合は、重要な設計判断と、その判断に必要な再利用根拠を `design.md` へ記載します。

`design.md` の `Reuse Assessment` には、すべての差分仕様単位について、汎用能力、再利用元分類、採用判断、対象と版、対象能力を調査範囲へ明記した最新の調査報告を記載します。一つの仕様単位に複数能力がある場合は行を分けます。レビューでは、能力の分解、調査範囲、依存の現在状態、採用判断の対応を確認します。

再利用元は `REPOSITORY_CODE`、`WORKSPACE_PACKAGE`、`DIRECT_DEPENDENCY`、`REPOSITORY_DEPENDENCY`、`TRANSITIVE_ONLY`、`NEW_EXTERNAL`、`EXISTING_UPDATE`、`NO_REUSABLE_CANDIDATE`、判断は `REUSE`、`ADOPT`、`UPDATE`、`REPLACE`、`LIMITED_COMPLEMENT` に分類します。推移依存と直接採用は区別します。`LIMITED_COMPLEMENT` は Credo の独自実装条件を満たす場合だけ使用し、代替不能の根拠を記録します。

### シナリオと試験の追跡

すべてのシナリオ見出しは、`#### Scenario: ... (CAPABILITY-S001)` の形式で安定した識別子を持ちます。追跡方向は Playwright E2E 試験からシナリオへの一方向です。Playwright E2E 試験の題名は `[CAPABILITY-S001]` で既存シナリオを参照できます。シナリオごとの自動試験は要求せず、他の試験はシナリオ識別子を参照しません。

`scripts/openspec/verify-scenario-coverage.mjs` は、主仕様へ進行中の差分を重ね、差分構造、要件操作、識別子の重複、変更間の競合を検査します。さらに、`tests/e2e` 配下の Playwright 試験題名にある参照が、主仕様または進行中の差分に存在するシナリオ識別子を指すことを確認します。

一つの変更に限った実効仕様を確認する場合は、次を実行します。

```bash
node scripts/openspec/verify-scenario-coverage.mjs --change <change-id>
```

`--change` で対象の変更と主仕様の組み合わせを選択できます。最終確認では引数なしの検査も実行し、進行中の変更間の競合を確認します。

### 自動試験の境界

自動試験は、確認済みの顧客価値を守り、意図しない退行が顧客へ届く前に検出するためだけに作成します。許可する分類は次のとおりです。

- Playwright E2E 試験は、公開された製品画面や操作を通る価値の高い顧客作業を保全し、シナリオ識別子を題名で参照できます。
- 純粋な単体試験は、顧客成果へ影響する決定的な規則を隔離して保全します。データベース、ネットワーク、ファイルシステム、サーバー、Workerd その他の実行環境へ接続しません。
- React の顧客向け UI 試験は、利用者に見える描画と操作を保全します。この目的に限り jsdom、MSW、Testing Library を利用できます。
- Storybook ブラウザ試験は、顧客向け共通 UI の描画、操作、画面幅への対応、テーマ、アクセシビリティを実ブラウザで保全します。

統合試験、接続試験、バックエンドHTTP・OpenAPI契約試験、実データベース試験、Workerd固有試験、ファイルシステム・子プロセスを使うツール自己試験、実行環境固有試験を作成しません。同じ顧客保証を複数の層やファイルで重複させず、価値の高い成果を保全できる最少数の試験を選びます。

試験だけのために製品コードへ API、公開要素、生成処理、分岐、実行基盤の接続設定を追加または維持しません。試験から製品内部へ到達する必要がある場合は製品コードを変更せず、その試験を削除します。

## 段階的な実行計画

`tasks.md` は、顧客成果または重要な設計判断を実装可能なまとまりにした粗い作業パッケージ台帳です。各項目は `- [ ] WP<number>: <成果>` とし、`Covers` と `Completion Evidence` を持ちます。

実装時に、現在の作業パッケージ、リポジトリの実態、直前の検証結果を読み、次の変更と確認を決めます。ファイル、補助処理、試験の詳細は、その時点で必要な範囲だけ計画します。

作業パッケージの完了条件は、リポジトリ内または CI で再現できる証跡に限定します。リリース、デプロイ、外部環境の操作、認証情報へのアクセス、外部承認を含めません。

## Review Depth

### 指摘の顧客価値判定

統括レビューは、委任された指摘を最終結果へ採用する前に、影響を受ける顧客、具体的に損なわれる体験または成果、観測事実から悪影響へ至る因果関係、および悪影響の深刻度、発生可能性、影響範囲を確認します。これらを証拠に基づいて説明できない指摘は採用しません。

統括レビューは、悪影響の深刻度、発生可能性、影響範囲に対して、必要な修正の実装負担、変更範囲、退行リスクが正当化されるかを判定します。問題自体が実在していても、期待できる顧客価値が修正負担、変更範囲、退行リスクに見合わない指摘は過剰レビューとして却下します。過剰レビューは、警告、軽微な指摘、任意改善へ格下げして残しません。

証拠によって確認されたセキュリティ、外部契約、リポジトリ必須規則への違反は修正対象として維持しますが、顧客への具体的な悪影響の説明を免除しません。最終結果へ残す各指摘には、顧客への悪影響と、修正負担に値する顧客価値の理由を記載します。

### `STANDARD`

通常の変更に対する既定の独立レビューです。次を確認します。

- 依頼、運用区分、UX モード、変更内容が一致していること。
- 適用される要件とシナリオを満たすこと。
- セキュリティ、依存方向、型、生成物、試験の規則を破っていないこと。
- UI 変更では、採用済みデザインへの忠実な実装、プロダクトデザイナーの関与、実ブラウザ確認の証跡があること。
- 不要なコード、未使用機能、仮置きが残っていないこと。

### `DEEP`

所有者が明示的に要求した場合、または確認済み顧客成果や外部契約に不可欠な一つの未解決の問いを `STANDARD` で解消できない場合に選びます。追加調査は、その問いを解消するために必要な経路や相互作用へ限定します。

## プルリクエスト記録

すべてのプルリクエストに次を記録します。

- `Operation Lane`: `DIRECT`、`BEHAVIOR`、`ARCHITECTURE` のいずれか。
- `UX Mode`: `NONE`、`CONTINUITY`、`SHAPE` のいずれか。
- `Review Depth`: `STANDARD`、`DEEP` のいずれか。
- `OpenSpec Change`: `BEHAVIOR` と `ARCHITECTURE` では変更識別子が必須。`DIRECT` では理由付きの `なし` を使用可能。
- `Scenario IDs`: `BEHAVIOR` と差分仕様を持つ `ARCHITECTURE` では一件以上必須。`DIRECT` と `skip_specs: true` の `ARCHITECTURE` では理由付きの `なし` を使用可能。

## 検証入口

```bash
pnpm exec openspec schema validate behavior-change
pnpm exec openspec schema validate architecture-change
pnpm exec openspec validate --all --strict
node scripts/openspec/verify-change-proposal.mjs
node scripts/openspec/verify-change-reuse-decisions.mjs
node scripts/openspec/verify-scenario-coverage.mjs
node scripts/openspec/verify-change-task-scope.mjs
```

通常は、これらを含む `pnpm lint:openspec` または `pnpm lint` を実行します。提案の機械検査は `Design Source` の存在と空欄でないことまでを確認します。参照先の読取可能性、所有者の受け入れ、要求とモックの相互対応や採用理由、整合性は計画レビューで確認します。
