#!/usr/bin/env sh
set -eu

# Serena MCP は uv tool として Python 3.13 環境へ導入する。
# --force により、postCreate 再実行時も同じコマンドで更新できるようにする。
uv tool install --force -p 3.13 serena-agent

# 導入後に実行できることを確認し、Dev Container postCreate の失敗点を明確にする。
serena --version
