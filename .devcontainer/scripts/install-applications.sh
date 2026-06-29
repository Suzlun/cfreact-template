#!/usr/bin/env sh
set -eu

# Dev Container の postCreate で導入するアプリケーションCLIを一箇所から呼び出す。
# Dockerfile はOS依存とPATH整備に限定し、更新頻度が高いCLIは個別スクリプトへ分割してここで順番に実行する。

# npm のグローバル導入先と pnpm の実行パスを、Dockerfile と同じユーザー領域へ固定する。
export NPM_CONFIG_PREFIX="${NPM_CONFIG_PREFIX:-${HOME}/.npm-global}"
export PNPM_HOME="${PNPM_HOME:-${HOME}/.local/share/pnpm}"
export PATH="${HOME}/.local/bin:${NPM_CONFIG_PREFIX}/bin:${PNPM_HOME}:${PATH}"

# ユーザー領域のツール配置先を先に作成し、postCreate 再実行時も同じ場所へ上書きできるようにする。
mkdir -p "${HOME}/.local/bin" "${NPM_CONFIG_PREFIX}/bin" "${PNPM_HOME}"

# pnpm は packageManager のバージョンを使うため、corepack を必ず有効化する。
corepack enable

# 各アプリケーションCLIは同じ粒度のスクリプトに分け、追加・更新・検証の責務を揃える。
sh .devcontainer/scripts/install-wrangler.sh
sh .devcontainer/scripts/install-opencode.sh
sh .devcontainer/scripts/install-serena.sh
sh .devcontainer/scripts/install-openspec.sh
sh .devcontainer/scripts/install-sentrux.sh
sh .devcontainer/scripts/install-agent-browser.sh
