# Changesetsリリース運用

この文書は、このテンプレートから作成したrepositoryで`develop -> release -> main -> develop`のリリース運用を有効化する手順を説明します。GitHub Actionsとリリーススクリプトはテンプレートに含まれますが、GitHub repository settings、GitHub App、Secrets、Variables、Environmentsはテンプレートから生成先へ複製されません。

## 自動化される処理

1. `develop`向けPull Requestへ通常またはempty Changesetが追加されていることを検査します。
2. `develop`のCI成功後、未消費の通常Changesetがあれば`release`とRelease PRを作成または更新します。
3. Release PRが開いている間に`develop`が進んだ場合、`release`へmerge commitで取り込み、前回リリース版から全Changesetを再計算します。
4. Release PRが`main`へmergeされると`release`を自動削除し、CI成功後に検証済み`main` commitへ`vX.Y.Z`tagとGitHub Releaseを作成します。
5. 新しい`vX.Y.Z`tagがpushされ、Cloudflare credentialsが設定されている場合だけ、独立したDeploy Workflowが本番環境へdeployします。
6. `sync/main-to-develop`から`develop`への同期PRを作成し、required checks成功後にmerge commitで自動mergeしてbranchを自動削除します。
7. 自動取り込みで競合した場合は強制更新せず、対象PRへ停止理由をコメントします。

全workspace packageはChangesetsのfixed groupとして単一versionへ更新されます。npm packageのpublishは行いません。

## 生成先repositoryの初期設定

### Branch

生成直後の`main`と同じcommitから`develop`を作成します。

```bash
git switch main
git pull --ff-only origin main
git switch -c develop
git push -u origin develop
```

GitHubのdefault branchを`develop`へ変更します。作業branchは`develop`から作り、通常のPull Requestは`develop`をbaseにします。

### GitHub App

リリース自動化専用のGitHub Appを作成し、生成先repositoryへinstallします。`GITHUB_TOKEN`で作成したPull Requestやpushは後続workflowを起動しないため、GitHub App tokenが必要です。

GitHub Appへ次のRepository permissionsだけを付与します。

| Permission    | Access         | 用途                                      |
| ------------- | -------------- | ----------------------------------------- |
| Contents      | Read and write | branch、commit、tag、GitHub Releaseの操作 |
| Pull requests | Read and write | Release PR、同期PR、auto-mergeの操作      |
| Issues        | Read and write | PRへの競合コメント                        |
| Metadata      | Read-only      | GitHub Appの必須permission                |

生成先repositoryへ次を登録します。

| 種別     | 名前                      | 値                             |
| -------- | ------------------------- | ------------------------------ |
| Variable | `RELEASE_APP_CLIENT_ID`   | GitHub AppのClient ID          |
| Secret   | `RELEASE_APP_PRIVATE_KEY` | GitHub AppのPEM形式private key |

private keyはログ、artifact、repositoryファイルへ保存しません。GitHub Appのinstall対象も生成先repositoryだけに限定します。

### Repository Settings

GitHubのPull Request設定でauto-mergeとmerge commitを有効にします。Release PRと同期PRは履歴の祖先関係を維持する必要があるため、squash mergeとrebase mergeは無効化します。

`.github/workflows/cleanup-release-branches.yml`はmerge済みの`release -> main`と`sync/main-to-develop -> develop`だけをGitHub App tokenで削除します。repository全体のhead branch自動削除設定には依存せず、通常の作業branchやcloseしただけの未merge branchは削除しません。

Actionsの既定`GITHUB_TOKEN`権限はread-onlyのままにします。書き込みは前節のGitHub App tokenだけが行います。

### Rulesets

`main`と`develop`でbranch削除、force push、直接pushを禁止し、Pull Request経由の更新を要求します。

`main`には次のrequired checksを設定します。

- `CI / verify`
- `Validate PR Template / Validate PR Template`

`develop`には次のrequired checksを設定します。

- `CI / verify`
- `Changeset Check / Require Changeset`
- `Validate PR Template / Validate PR Template`

同期PRは同一repositoryの`sync/main-to-develop`だけがChangeset追加を免除されます。fork上の同名branchは免除されません。

`refs/tags/v*.*.*`を対象にtag rulesetも作成し、tagの作成、更新、削除を制限します。bypass actorには前節のリリース自動化用GitHub AppだけをAlways allowとして登録します。これにより、Release Workflow以外が本番デプロイを起動するtagを作成または付け替えることを防ぎます。

### Production Environment

GitHubの`production` EnvironmentへCloudflare認証情報を登録します。

| 種別             | 名前                    | 用途                                    |
| ---------------- | ----------------------- | --------------------------------------- |
| Secret           | `CLOUDFLARE_API_TOKEN`  | Cloudflare resource作成とWorkers deploy |
| VariableかSecret | `CLOUDFLARE_ACCOUNT_ID` | deploy対象のCloudflare account          |
| Variable（任意） | `WRANGLER_ENVIRONMENT`  | 未設定時は`production`                  |

Cloudflare API tokenは対象accountのD1、KV、R2、Workersへ必要な権限だけを付与します。credentialsが未設定でもタグとGitHub Releaseは作成され、Deploy Workflowだけが安全に省略されます。credentials設定後に既存tagをdeployする場合は、Deploy Workflowを`workflow_dispatch`で実行し、対象の`vX.Y.Z`tagを入力します。

## Changesetの追加

`develop`向けPull RequestごとにChangesetを1つ追加します。

```bash
# 顧客へ届く変更
pnpm changeset

# versionを上げないCI、文書、内部運用などの変更
pnpm changeset --empty
```

通常Changesetでは影響するworkspace packageと`patch`、`minor`、`major`を選択します。fixed group全体は、全Changesetの最大影響を前回リリース版へ1回だけ適用したversionになります。patch Changesetが同じリリースに複数あってもpatch番号は1つだけ上がります。

empty Changesetしか存在しない場合、Release PRは作成されません。empty Changesetは次の通常リリースで通常Changesetと一緒に消費されます。

## リリース版の変更

自動計算より大きなbumpが必要な場合は、`release`上の`.release/plan.json`だけを変更します。

```json
{
  "minimumBump": "major",
  "version": "0.2.0"
}
```

編集できる`minimumBump`は`auto`、`patch`、`minor`、`major`です。`version`は自動生成値なので手で変更しません。push後にPrepare Release workflowが全Changesetを再計算し、rootと全workspaceのversion、CHANGELOG、lockfileを更新します。

新しいリリースを開始すると`minimumBump`は`auto`へ戻ります。workspaceの`package.json`や生成済みCHANGELOGを直接編集しても、次の再生成で`develop`を基準に置き換えられます。

## Release PRのmerge

Release PRのCIとレビューが完了したら、merge commitで`main`へmergeします。squashまたはrebaseすると`main`が`develop`の履歴を継承できず、自動同期の安全条件を満たしません。

Release WorkflowはRelease PR由来ではない通常の`main`更新をリリースしません。Release PRのmerge、単一version、Changeset消費、CHANGELOG、`develop`の祖先関係を確認した後にtagとGitHub Releaseを作成します。

Deploy Workflowは新しい`vX.Y.Z`tagのpushで独立して起動し、tag対象commitが`main`履歴に含まれることと、tag名とrelease planのversion一致を検証してからCloudflareへdeployします。同じRelease Workflowを再実行した場合、同じSHAのtagとGitHub Releaseは再利用されます。既存tagが別SHAを指している場合は失敗します。

## 競合時の対応

`develop -> release`で競合した場合は、Release PRのbranchへ`develop`をmergeし、競合を解消してpushします。`release`上の手動commitは自動処理が強制更新しません。

`main -> develop`で競合した場合は、`sync/main-to-develop`へ`main`をmergeし、競合を解消してpushします。required checksが成功すると設定済みauto-mergeがmerge commitで取り込みます。
