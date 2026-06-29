#!/usr/bin/env sh
set -eu

# AI エージェントがブラウザ操作を行うための agent-browser CLI を latest で導入する。
# npm の導入先は呼び出し元で設定済みのユーザー領域を使い、postCreate 再実行時も同じ場所へ更新する。
npm install -g agent-browser@latest

# Linux ARM64 では Chrome for Testing の公式ビルドが提供されないため、Dockerfile で導入した OS の Chromium を利用する。
# それ以外の環境では公式推奨どおり Chrome for Testing を取得し、ブラウザ自動操作をすぐ実行できる状態にする。
case "$(uname -m)" in
  aarch64 | arm64)
    CHROMIUM_PATH="$(command -v chromium || command -v chromium-browser || true)"
    if [ -z "${CHROMIUM_PATH}" ]; then
      printf '%s\n' "chromium executable is required for agent-browser on Linux ARM64." >&2
      exit 1
    fi
    mkdir -p "${HOME}/.agent-browser"
    printf '%s\n' '{"executablePath":"'"${CHROMIUM_PATH}"'"}' > "${HOME}/.agent-browser/config.json"
    ;;
  *)
    agent-browser install
    ;;
esac

# 導入後に実行できることを確認し、Dev Container postCreate の失敗点を明確にする。
agent-browser --version
agent-browser doctor --offline --quick
