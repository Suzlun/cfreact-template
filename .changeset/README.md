# Changesets

`develop`向けの各Pull Requestには、通常のChangesetまたはempty Changesetを1つ追加します。

```bash
# リリースへ反映する変更
pnpm changeset

# バージョンを上げない変更
pnpm changeset --empty
```

通常のChangesetでは影響を受けるworkspace packageとSemVerの変更種別を選択します。全workspace packageは単一のアプリケーションバージョンとして固定されているため、最終的には同じバージョンへ更新されます。

Changesetの消費とバージョン更新は`release`の自動化だけが実行します。開発ブランチ上で`pnpm changeset version`を実行しないでください。
