# 調査報告: 実行環境依存試験と試験方針の整合

## 基本情報

- 調査日時: 2026-08-18 12:49:05 +0000
- 調査者: `OpenCode`
- 依頼概要: `wwreact-template`を除く全リポジトリで、禁止された実行環境依存・Workerd固有試験と現行試験方針の不一致を解消する。
- 調査範囲: `/home/suzlun/repos`配下の`cfreact-template`、`cfsvelte-template`、`cf-tamac`、`lectrum`、`witwire-net/cfreact-template`、`witwire-net/witwire-id`。製品の観測可能な挙動、API契約、UI変更は対象外とした。
- 調査時点のリポジトリ: `cfreact-template` `main@21f7fd7`、`cfsvelte-template` `main@33ef3ea`、`cf-tamac` `develop@b0cd56b1`、`lectrum` `develop@7b41f1de`、`witwire-net/cfreact-template` `develop@ba58acfe`、`witwire-net/witwire-id` `develop@4c71c493`

## 結論

確認済みの事実として、6リポジトリの現行ソース、試験設定、パッケージ定義、ロックファイルから`@cloudflare/vitest-pool-workers`、`cloudflare:test`、`cloudflareTest`の実行参照を除去した。`cfreact-template`、`cfsvelte-template`、`witwire-net/cfreact-template`は既存の修正済みコミットへprimary checkoutを同期し、`cf-tamac`、`lectrum`、`witwire-net/witwire-id`は追加の是正コミットを作成して追跡先へ送信した。

`lectrum`はWorkerd上で実行していたバックエンド試験を廃止し、データベース、ネットワーク、ファイルシステム、サーバー、Workerdへ接続しない純粋なドメイン・ユースケース規則71件だけを通常のVitestで保持した。`witwire-id`はバックエンドHTTP、OpenAPI契約、実データベース、サーバー実行面、ファイルシステム・子プロセス依存の自己検査を削除した。`cf-tamac`は既存の大規模な未コミット作業を保全するため、清潔な既存worktreeでWorkerd専用のDurable Object SQLite試験と専用設定だけをコミットした。

## 既存調査の確認

| 既存報告                                                                                             | 関連性                                 | 鮮度・変化頻度                                   | 現在の情報との整合性                     | 再検証結果                                                           | 採否 |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------- | ---- |
| `witwire-net/witwire-id/docs/report/research/26/08/18/115559-test-policy-cleanup.md`                 | `witwire-id`の試験整理と検証を記録する | 同日。作業ツリーと依存状態は変更で直ちに劣化する | 今回の最終コミット内容と一致する         | 現行マニフェスト、試験一覧、コミット`4c71c493`、検証結果で再確認した | 採用 |
| `witwire-net/witwire-id/docs/report/research/26/08/12/161408-cloudflare-do-cryptokey-persistence.md` | 旧プール依存を記録する                 | 6日経過。依存状態は変化しやすい                  | 現在は依存が削除され、当時の記録と異なる | 現行`package.json`と`pnpm-lock.yaml`を優先した                       | 参考 |

ほかの5リポジトリでは、ファイル名に`test`、`testing`、`vitest`、`workerd`を含む関連調査報告は確認できなかった。既存報告は現在の根拠として無条件に再利用せず、現行リポジトリを一次資料として再確認した。

## 調査方法

各リポジトリの`AGENTS.md`、試験方針、パッケージ定義、Vitest設定、試験ファイル、CI、文書、Git状態を確認した。`@cloudflare/vitest-pool-workers`、`cloudflare:test`、`cloudflareTest`、実行環境固有設定、非Playwright試験のScenario識別子、ファイルシステム・子プロセス・サーバー参照を検索した。削除対象だけが参照していた製品公開要素や差し替え口は参照元を確認して除去した。外部ウェブ資料は使用していない。

## 確認済みの事実

| 事実                                                                                              | 根拠                                                                                      | 確認日時   | 情報の消費期限・変化要因         |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | -------------------------------- |
| 6リポジトリの現行ソース・設定・マニフェストにWorkers用Vitestプールの実行参照はない                | 各リポジトリの`package.json`、`pnpm-lock.yaml`、`packages/**`への最終検索                 | 2026-08-18 | 依存・試験設定の追加で変化する   |
| 個人版React、個人版Svelte、WitWire版Reactにバックエンド試験ファイルは残っていない                 | 各`packages/backend/**/*.{test,spec}.*`の検索、`21f7fd7`、`33ef3ea`、`ba58acfe`           | 2026-08-18 | 試験追加で変化する               |
| `lectrum`は純粋なバックエンド試験7ファイル71件を保持し、全体349件とリリース規則8件が成功した      | `packages/backend/vitest.config.ts:3-7`、`pnpm test:backend`、`pnpm test:run`、`7b41f1de` | 2026-08-18 | ドメイン規則と試験構成で変化する |
| `cf-tamac`のAgent試験37ファイル162件、Agent型検査、整形、コード生成は成功した                     | `packages/agent/vitest.config.ts:8-18`、各実行結果、`b0cd56b1`                            | 2026-08-18 | Agent実装と依存で変化する        |
| `witwire-id`はVitest、Storybook 700件、静的検査、コード生成、ビルドが成功した                     | `vitest.config.ts:9-28`、`.github/workflows/ci.yml:73-101`、`4c71c493`                    | 2026-08-18 | UI・依存・構築設定で変化する     |
| `witwire-id`のE2Eは別worktreeのCockroachDBコンテナが固定ポートを使用しているため起動前に停止した  | `compose.yaml:11-15`、`pnpm test:e2e`の実行結果                                           | 2026-08-18 | ローカルコンテナ状態で変化する   |
| Wrangler由来の`workerd`と`pnpm-workspace.yaml`の個別ビルド許可は製品開発・E2Eに必要なため保持した | 各`pnpm-lock.yaml`、`pnpm-workspace.yaml`                                                 | 2026-08-18 | Wrangler依存版で変化する         |

## 推論と判断

| 推論・判断                                                | 根拠となる事実                                   | 前提                                           | 確信度 |
| --------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------- | ------ |
| 試験方針とWorkers用Vitestプールの直接的な不一致は解消した | 現行参照がなく、許可試験が成功している           | 履歴文書の過去記述を現行設定と混同しない       | 高     |
| `workerd`本体を一律削除しない判断は正しい                 | Wranglerと公開製品サーバー起動が依存する         | 製品開発・配置・E2Eを維持する                  | 高     |
| `witwire-id`のE2E未確認はコード不良を示さない             | Playwright開始前に固定ホストポート競合で停止した | 既存コンテナを停止しないという所有者判断を守る | 高     |

## 矛盾・不確実性

- `cf-tamac`のprimary checkoutには今回以前から多数の変更があり、追跡先より3コミット遅れている。是正コミットは清潔な既存worktreeから送信済みだが、primary checkout自体は清潔ではない。
- `cf-tamac`の全体試験は、今回の変更対象外であるDeploy artifact自己試験と既存README差分の不一致1件で失敗した。対象のAgent試験は成功している。
- `witwire-id`のE2Eは所有者判断により既存コンテナを停止せず、未確認として扱った。

## 推奨事項

なし（理由: 依頼された不一致はコミット・送信済みであり、残存事項は別作業の未コミット状態または所有者が維持を選択した実行環境競合である。）

## 出典

### ウェブ

なし（理由: リポジトリとローカル検証結果だけを調査した。）

### リポジトリ

- `cfreact-template/AGENTS.md:75-89`（`main@21f7fd7`）: 許可・禁止する試験分類。
- `cfsvelte-template/AGENTS.md:75-82`（`main@33ef3ea`）: Svelte版の試験分類。
- `cf-tamac/packages/agent/vitest.config.ts:8-18`（`develop@b0cd56b1`）: Node環境のAgent試験設定。
- `lectrum/packages/backend/vitest.config.ts:3-7`（`develop@7b41f1de`）: 純粋なバックエンド試験対象。
- `witwire-net/cfreact-template/AGENTS.md:85-100`（`develop@ba58acfe`）: WitWire版Reactの試験分類。
- `witwire-net/witwire-id/vitest.config.ts:9-28`（`develop@4c71c493`）: 保持したVitestプロジェクト。

## 調査ログ

1. 調査規則、報告テンプレート、既存報告を確認した。
2. 6リポジトリのGit状態、追跡先、試験依存、設定、試験ファイル、文書参照を並行監査した。
3. 清潔なprimary checkoutを追跡先へ早送りし、未解消の3リポジトリを修正した。
4. 許可された試験、型検査、整形、静的検査、コード生成、構築を実行した。
5. 各是正コミットを追跡先へ送信し、リモートとの差を確認した。

## 残存課題

- `cf-tamac`のprimary checkoutにある既存の大規模作業は、所有者の作業単位で追跡先と統合する必要がある。
- `witwire-id`のE2Eは、固定ポートを使用する既存コンテナを停止できる時点で再確認できる。今回の所有者判断では未確認のまま保持する。
