namespace CfreactTemplate;

/**
 * 入力が公開 API の契約を満たさない場合に返す安全なエラー。
 */
model InvalidRequestError {
  code: "INVALID_REQUEST";
  message: string;
}

/**
 * 指定されたユーザーが存在しない場合に返す安全なエラー。
 */
model UserNotFoundError {
  code: "USER_NOT_FOUND";
  message: string;
}

/**
 * メールアドレスの一意制約によりユーザーを作成できない場合に返す安全なエラー。
 */
model UserEmailAlreadyExistsError {
  code: "USER_EMAIL_ALREADY_EXISTS";
  message: string;
}

/**
 * サーバー内部の詳細を公開せずに予期しない失敗を通知する安全なエラー。
 */
model InternalError {
  code: "INTERNAL_ERROR";
  message: string;
}
