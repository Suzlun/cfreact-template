#!/usr/bin/env sh
set -eu

# Cloudflare Workers の開発・デプロイに使う Wrangler CLI を導入する。
# npm の導入先は呼び出し元で設定済みのユーザー領域を使い、postCreate 再実行時も同じ場所へ更新する。
npm install -g wrangler@4

# 導入後に実行できることを確認し、Dev Container postCreate の失敗点を明確にする。
wrangler --version
