#!/usr/bin/env sh
set -eu

# AI 支援開発の入口となる OpenCode CLI を latest で導入する。
# OpenCode 自身のアップグレード処理も実行し、postCreate 後に最新CLIとして使える状態にする。
npm install -g opencode-ai@latest
opencode upgrade

# 導入後に実行できることを確認し、Dev Container postCreate の失敗点を明確にする。
opencode --version
