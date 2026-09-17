# Storybookによるモック確認

## 標準構成

Dev Containerを標準の実行環境とします。OpenCodeが要求確認とReactモックの編集を担当し、Storybookで実際の表示と操作を確認します。

Composeの`dependencies`が依存を導入した後、`dev`と`storybook`が起動します。`dev`は編集・検証用、`storybook`は確認サービス用です。同じプロジェクトのソースを共有し、各サービスは独立したネットワーク名前空間で動作します。VS Codeを閉じても継続し、停止は明示的に行います。

```bash
docker compose -f .devcontainer/compose.yaml up -d --build storybook
docker compose -f .devcontainer/compose.yaml port storybook 7456
docker compose -f .devcontainer/compose.yaml logs -f storybook
docker compose -f .devcontainer/compose.yaml stop
```

VS Codeでは転送ポート`storybook:7456`を開きます。開発コンテナ内のブラウザからは`http://storybook:7456/`へ接続できます。ホスト側ポートは既定で自動割り当てされます。固定する場合は起動時に`STORYBOOK_HOST_PORT`を指定します。

複数の作業場所をComposeから同時に起動する場合は、`-p <一意な作業名>`でComposeのプロジェクト名も分けてください。

```bash
STORYBOOK_HOST_PORT=7456 docker compose -f .devcontainer/compose.yaml up -d storybook
```

## モックの作成

公開アプリごとに`mockups/<app>/src/App.tsx`を中心とした統合Reactモックを置きます。`App.stories.tsx`で初期画面と状態を指定し、画面内の移動、入力、エラーからの復旧はReactのローカル状態で表現します。表示例や初期条件を変更したら新しい状態から開始します。

共通UIは`@cfreact-template/ui`の公開サブパスから直接利用します。`mockups/.storybook/main.ts`は共通UIのVite設定を参照し、Tailwind CSS 4とReact Compilerを共通化します。

```bash
pnpm storybook:mockup
pnpm build:mockup
```

開発サーバーはポート6007、ビルド先はGit管理対象外の`mockups/dist`です。全アプリの表示例を同じモックカタログから選択します。共通UI部品のカタログは従来の`pnpm storybook`で起動します。

要求の`UI Mock References`と提案の`Design Source`には、例えば`mockups/main/src/App.stories.tsx#UsersError`のように、ソースと表示例を特定する参照を記録します。実行時のURLはホスト環境が決めます。

## ネイティブでの起動

リポジトリ指定のNode.jsとpnpmを用意し、その環境で依存を導入します。

```bash
pnpm install --frozen-lockfile
pnpm storybook:host
```

入口は`http://127.0.0.1:7456/`、既定のプロジェクトは現在の作業ディレクトリです。終了操作で配下のStorybookも停止します。依存導入と開発コマンドは同じ実行環境に揃えてください。

## 複数プロジェクトのホスト

共有環境の設定ファイルに、公開するプロジェクトを明示的に登録します。パスは実行環境から読める絶対パスです。各プロジェクトに同じ設定ファイルを置く必要はありません。

```json
{
  "host": "127.0.0.1",
  "port": 7456,
  "allowedHosts": ["preview.example.com"],
  "projects": [
    {
      "id": "project-a",
      "title": "Project A",
      "directory": "/srv/projects/project-a"
    },
    {
      "id": "project-b",
      "title": "Project B",
      "directory": "/srv/projects/project-b"
    }
  ]
}
```

```bash
pnpm storybook:host --config /srv/storybook/projects.json
```

`configDir`の既定値は各プロジェクトの`mockups/.storybook`です。別のStorybookを扱う場合は、その設定ディレクトリをプロジェクトからの相対パスで指定します。対象の作業ディレクトリからStorybookとフレームワークの依存を解決できることが必要です。

各Storybookは独立したプロセスとして起動し、既定で16006から順番に内部ポートを割り当てます。必要ならホスト設定の`internalPort`で開始番号を変更します。公開URLは`/projects/<id>/`です。作業ツリーを登録する場合も、独立したIDと作業ディレクトリを指定します。

コンテナ内でGitも利用する作業ツリーでは、`.git`が参照する共通Gitディレクトリへも到達できるマウントが必要です。

元の設定は参照したまま、ホスト側の一時設定で公開パス、アセット、WebSocketの接続を揃えます。Storybook 10の管理チャンネルは既存の接続トークンで対象を識別します。プロジェクト側へ共有環境のホスト名やパスを書き込まず、単独起動も維持します。

登録対象の依存は起動前に導入してください。共有ホストは他プロジェクトの依存やソースを書き換えません。プロジェクトの起動失敗はログで確認し、修正後に確認サービスを再起動します。

## 限定公開

コンテナ内部の入口は`0.0.0.0:7456`で待ち受け、ホストへの公開はループバックアドレスに限定します。Tunnelなどの認証付き入口を利用する場合は、その公開ホストを`allowedHosts`へ設定し、HTTPとWebSocketを同じ入口へ転送します。

開発サーバーはソースを配信するため、閲覧権限は対象プロジェクトのソースを共有できる人に限定します。同一オリジンのプロジェクトはブラウザ上の信頼範囲を共有します。

## 動作確認

- モックと共通UIの変更が、開いたままの画面へ反映されること。
- 表示例の切り替えで初期状態が再現されること。
- デスクトップ・モバイル双方で入力、作成、エラーからの復旧を操作できること。
- 管理画面、プレビュー、アセット、WebSocketが公開入口を通ること。
- 確認サービスの停止で、そのサービスが起動した子プロセスも終了すること。
- 環境固有設定が対象リポジトリへ書き込まれていないこと。
