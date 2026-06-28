#!/usr/bin/env sh
set -eu

# OpenSpec CLI はこのリポジトリの spec workflow と互換性があるバージョンを導入する。
# バージョンを固定し、OpenSpec artifact 生成や validate の挙動を安定させる。
npm install -g @fission-ai/openspec@1.4.1

# 導入後に実行できることを確認し、Dev Container postCreate の失敗点を明確にする。
openspec --version
