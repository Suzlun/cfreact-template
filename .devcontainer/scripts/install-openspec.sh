#!/usr/bin/env sh
set -eu

# 計画成果物の生成と検証には、ルートの依存定義と同じ版を使用する。
npm install -g @fission-ai/openspec@1.11.0

# 導入後に実行できることを確認し、Dev Container postCreate の失敗点を明確にする。
openspec --version
