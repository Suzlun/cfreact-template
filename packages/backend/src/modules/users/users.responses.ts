import type { operations } from '@cfreact-template/backend/generated/api/openapi';
import { CreateUserResponse } from '@cfreact-template/backend/generated/api/users/users.zod';

/** createUser の 400 応答型。OpenAPI から抽出し、手書き DTO を作らない。 */
type CreateUserInvalidRequestResponse =
  operations['createUser']['responses'][400]['content']['application/json'];

/** createUser の 409 応答型。OpenAPI から抽出し、手書き DTO を作らない。 */
type CreateUserConflictResponse =
  operations['createUser']['responses'][409]['content']['application/json'];

/** `users` モジュールで共用する安全な内部エラー応答型。 */
type InternalErrorResponse =
  operations['createUser']['responses'][500]['content']['application/json'];

/**
 * ユーザー作成の成功応答を生成スキーマで検証する。
 *
 * @remarks
 * 外部通信や状態変更は行わない純粋な変換である。
 *
 * @param value サービスが返した作成済みユーザー。
 * @returns `createUser` の 201 応答契約を満たすユーザー。
 * @throws 値が生成された `CreateUserResponse` スキーマを満たさない場合。
 *
 * @example
 * ```ts
 * const response = createUserSuccessResponse(user);
 * ```
 */
export const createUserSuccessResponse = (
  value: unknown
): operations['createUser']['responses'][201]['content']['application/json'] => {
  // `Orval` が 201 応答バリデーターを生成しないため、返却直前に同じ生成スキーマで検証する。
  return CreateUserResponse.parse(value);
};

/**
 * 入力不正時の安全なエラー応答を生成する。
 *
 * @remarks
 * 引数を取らず、例外、副作用、外部通信なしで新しい固定応答を返す。
 *
 * @returns `INVALID_REQUEST` と利用者向け固定メッセージ。
 *
 * @example
 * ```ts
 * const response = invalidRequestResponse();
 * ```
 */
export const invalidRequestResponse = (): CreateUserInvalidRequestResponse => ({
  code: 'INVALID_REQUEST',
  message: 'Invalid request',
});

/**
 * メールアドレス重複時の安全なエラー応答を生成する。
 *
 * @remarks
 * 引数を取らず、例外、副作用、外部通信なしで新しい固定応答を返す。
 *
 * @returns `USER_EMAIL_ALREADY_EXISTS` と利用者向け固定メッセージ。
 *
 * @example
 * ```ts
 * const response = emailConflictResponse();
 * ```
 */
export const emailConflictResponse = (): CreateUserConflictResponse => ({
  code: 'USER_EMAIL_ALREADY_EXISTS',
  message: 'User email already exists',
});

/**
 * ユーザー未存在時の安全なエラー応答を生成する。
 *
 * @remarks
 * 引数を取らず、例外、副作用、外部通信なしで新しい固定応答を返す。
 *
 * @returns `USER_NOT_FOUND` と利用者向け固定メッセージ。
 *
 * @example
 * ```ts
 * const response = userNotFoundResponse();
 * ```
 */
export const userNotFoundResponse =
  (): operations['getUser']['responses'][404]['content']['application/json'] => ({
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  });

/**
 * 予期しない失敗時の安全なエラー応答を生成する。
 *
 * @remarks
 * 引数を取らず、例外、副作用、外部通信なしで新しい固定応答を返す。
 *
 * @returns `INTERNAL_ERROR` と内部情報を含まない固定メッセージ。
 *
 * @example
 * ```ts
 * const response = internalErrorResponse();
 * ```
 */
export const internalErrorResponse = (): InternalErrorResponse => ({
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
});

/**
 * 閉じた失敗型の処理漏れを型検査と実行時例外で検出する。
 *
 * @remarks
 * 外部通信や状態変更は行わず、到達した場合は必ず例外を送出する。
 *
 * @param failure switch で処理されなかった到達不能な失敗。
 * @returns 到達不能なため値を返さない。
 * @throws 失敗型の追加に対するハンドラーの分岐が不足している場合。
 *
 * @example
 * ```ts
 * const unreachable: never = value;
 * return assertNever(unreachable);
 * ```
 */
export const assertNever = (failure: never): never => {
  // 型の網羅性が崩れた場合は安全な未処理例外経路へ渡し、誤った応答を返さない。
  throw new Error(`Unhandled users failure: ${String(failure)}`);
};
