#!/usr/bin/env sh
set -eu

# Sentrux はユーザー指定により latest を常に導入する。
# 固定バージョンではないため、GitHub Releases API の digest を必ず検証してから配置する。
REPO="sentrux/sentrux"

# CI では権限を避けたい場合に SENTRUX_INSTALL_DIR を差し替えられるようにする。
# Dev Container の postCreate では node ユーザー実行になるため、通常はユーザー領域へ配置される。
INSTALL_DIR="${SENTRUX_INSTALL_DIR:-/usr/local/bin}"

# 一時ファイルは終了時に必ず削除し、取得したバイナリを作業ディレクトリへ残さない。
TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT INT TERM

# 現在の OS と CPU アーキテクチャから、Sentrux release asset 名を決定する。
# 未対応の環境では曖昧に進めず、明示的に失敗させる。
OS="$(uname -s)"
ARCH="$(uname -m)"
case "${OS}:${ARCH}" in
  Linux:x86_64)
    ASSET_NAME="sentrux-linux-x86_64"
    ;;
  Linux:aarch64|Linux:arm64)
    ASSET_NAME="sentrux-linux-aarch64"
    ;;
  Darwin:arm64|Darwin:aarch64)
    ASSET_NAME="sentrux-darwin-arm64"
    ;;
  *)
    echo "Unsupported platform for Sentrux latest binary: ${OS} ${ARCH}" >&2
    exit 1
    ;;
esac

# GitHub Releases API から latest release のメタデータを取得する。
# curl が失敗した場合はネットワークまたは GitHub 側の問題として即時失敗する。
RELEASE_JSON="${TMP_DIR}/release.json"
curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" -o "${RELEASE_JSON}"

# Node.js で JSON を解析し、対象 asset の URL と sha256 digest を抽出する。
# digest が提供されない場合は、latest 取得でも供給元検証ができないため失敗させる。
ASSET_INFO="$(RELEASE_JSON="${RELEASE_JSON}" ASSET_NAME="${ASSET_NAME}" node <<'NODE'
const fs = require('node:fs');

const releasePath = process.env.RELEASE_JSON;
const assetName = process.env.ASSET_NAME;
const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
const asset = release.assets.find((entry) => entry.name === assetName);

if (!asset) {
  throw new Error(`Sentrux release asset not found: ${assetName}`);
}

if (typeof asset.digest !== 'string' || !asset.digest.startsWith('sha256:')) {
  throw new Error(`Sentrux release asset digest is missing: ${assetName}`);
}

process.stdout.write(`${release.tag_name}\n${asset.browser_download_url}\n${asset.digest.slice('sha256:'.length)}\n`);
NODE
)"

# 抽出結果を順番に読み取り、ログにはバージョンと asset 名だけを出す。
# URL と digest は後続のダウンロードと検証に使う。
SENTRUX_VERSION="$(printf '%s\n' "${ASSET_INFO}" | sed -n '1p')"
DOWNLOAD_URL="$(printf '%s\n' "${ASSET_INFO}" | sed -n '2p')"
EXPECTED_SHA256="$(printf '%s\n' "${ASSET_INFO}" | sed -n '3p')"

echo "Installing Sentrux ${SENTRUX_VERSION} (${ASSET_NAME})"

# release asset を一時ファイルへ保存し、検証が完了するまで実行パスへ配置しない。
BINARY_PATH="${TMP_DIR}/sentrux"
curl -fsSL "${DOWNLOAD_URL}" -o "${BINARY_PATH}"

# Linux では sha256sum、macOS では shasum を使って release API の digest と一致するか確認する。
# digest 不一致は改ざんまたは取得失敗として扱い、導入を中止する。
if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL_SHA256="$(sha256sum "${BINARY_PATH}" | cut -d ' ' -f 1)"
elif command -v shasum >/dev/null 2>&1; then
  ACTUAL_SHA256="$(shasum -a 256 "${BINARY_PATH}" | cut -d ' ' -f 1)"
else
  echo "sha256 verification tool is not available" >&2
  exit 1
fi

if [ "${ACTUAL_SHA256}" != "${EXPECTED_SHA256}" ]; then
  echo "Sentrux sha256 mismatch for ${ASSET_NAME}" >&2
  echo "expected: ${EXPECTED_SHA256}" >&2
  echo "actual:   ${ACTUAL_SHA256}" >&2
  exit 1
fi

# 検証済みバイナリだけを実行可能にして配置する。
# /usr/local/bin に書けない通常ユーザー環境では sudo を試し、sudo も無い場合はユーザー領域へ配置する。
chmod 755 "${BINARY_PATH}"
TARGET_DIR="${INSTALL_DIR}"
if mkdir -p "${TARGET_DIR}" 2>/dev/null && [ -w "${TARGET_DIR}" ]; then
  mv "${BINARY_PATH}" "${TARGET_DIR}/sentrux"
elif command -v sudo >/dev/null 2>&1; then
  sudo mkdir -p "${TARGET_DIR}"
  sudo mv "${BINARY_PATH}" "${TARGET_DIR}/sentrux"
else
  TARGET_DIR="${HOME}/.local/bin"
  mkdir -p "${TARGET_DIR}"
  mv "${BINARY_PATH}" "${TARGET_DIR}/sentrux"
  echo "Installed Sentrux to ${TARGET_DIR}; ensure this directory is in PATH for future shells." >&2
fi

# 配置後に実行できることを確認し、Dev Container postCreate や CI の失敗点を明確にする。
"${TARGET_DIR}/sentrux" --version
