#!/usr/bin/env sh
set -eu

# ホスト側で取得した Git ユーザー情報を保存する作業ディレクトリを定義する。
# このディレクトリはリポジトリへ含めず、devcontainer の起動処理だけで利用する。
STATE_DIR=".devcontainer/.host-git"

# Git のコミット作成に必要なユーザー名の保存先を定義する。
# 入力はホストの Git 設定で、出力はコンテナ内で読み取る一時ファイルである。
NAME_FILE="${STATE_DIR}/user.name"

# Git のコミット作成に必要なメールアドレスの保存先を定義する。
# 入力はホストの Git 設定で、出力はコンテナ内で読み取る一時ファイルである。
EMAIL_FILE="${STATE_DIR}/user.email"

# ホスト上で解決された Git 設定から指定キーの値を安全に保存する。
# 第 1 引数は Git 設定キー、第 2 引数は保存先ファイルで、値が未設定なら保存先を削除する。
capture_git_value() {
  key="$1"
  target_file="$2"
  temp_file="${target_file}.tmp"

  # ホストの Git が解決した値だけを読み取り、資格情報や他の設定をコンテナへ持ち込まない。
  if git config --global --get "${key}" > "${temp_file}"; then
    # 取得に成功した値をアトミックに置き換え、途中で中断しても壊れた設定を残さない。
    mv "${temp_file}" "${target_file}"
  else
    # ホスト側に値がない場合は古い保存値を消し、存在しないユーザー情報を引き継がない。
    rm -f "${target_file}" "${temp_file}"
  fi
}

# 保存済みの Git 設定値をコンテナ内の node ユーザーのグローバル設定へ反映する。
# 第 1 引数は Git 設定キー、第 2 引数は保存元ファイルで、空または未存在なら何もしない。
apply_git_value() {
  key="$1"
  source_file="$2"

  # 値が存在する場合だけ設定し、未設定のホスト情報でコンテナ設定を上書きしない。
  if [ -s "${source_file}" ]; then
    # 改行を除いた保存値を Git のグローバル設定へ反映し、コミット時の author 解決に使わせる。
    git config --global "${key}" "$(cat "${source_file}")"
  fi
}

# 呼び出しモードに応じて、ホスト側の取得処理またはコンテナ側の反映処理を実行する。
# 想定外の引数では失敗させ、devcontainer 設定の誤りを見逃さない。
case "${1:-}" in
  capture)
    # ホスト側で保存先ディレクトリを作成し、以降の値保存が失敗しないようにする。
    mkdir -p "${STATE_DIR}"

    # ホスト Git が認識しているユーザー名を保存し、コンテナ側へ必要最小限の情報だけ渡す。
    capture_git_value "user.name" "${NAME_FILE}"

    # ホスト Git が認識しているメールアドレスを保存し、コンテナ側へ必要最小限の情報だけ渡す。
    capture_git_value "user.email" "${EMAIL_FILE}"
    ;;
  apply)
    # コンテナ側で保存済みユーザー名を反映し、Git commit の author 名として利用できるようにする。
    apply_git_value "user.name" "${NAME_FILE}"

    # コンテナ側で保存済みメールアドレスを反映し、Git commit の author メールとして利用できるようにする。
    apply_git_value "user.email" "${EMAIL_FILE}"
    ;;
  *)
    # 誤ったモード指定は利用方法を標準エラーに出して終了し、静かな失敗を防ぐ。
    printf '%s\n' "usage: $0 capture|apply" >&2
    exit 2
    ;;
esac
