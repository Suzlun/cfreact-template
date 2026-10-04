import { CreateUserResponse } from '@cfreact-template/core/generated/api/users/users.zod';

import type { operations } from '@cfreact-template/core/generated/api/openapi';

type InvalidRequestResponse =
  operations['createUser']['responses'][400]['content']['application/json'];
type ConflictResponse = operations['createUser']['responses'][409]['content']['application/json'];
type InternalErrorResponse =
  operations['createUser']['responses'][500]['content']['application/json'];

/** ユーザー作成の成功値をcore生成スキーマで検証する。 */
export const createUserSuccessResponse = (
  value: unknown
): operations['createUser']['responses'][201]['content']['application/json'] => {
  return CreateUserResponse.parse(value);
};

/** core入力不正の固定応答を返す。 */
export const invalidRequestResponse = (): InvalidRequestResponse => ({
  code: 'INVALID_REQUEST',
  message: 'Invalid request',
});

/** coreメール重複の固定応答を返す。 */
export const emailConflictResponse = (): ConflictResponse => ({
  code: 'USER_EMAIL_ALREADY_EXISTS',
  message: 'User email already exists',
});

/** coreユーザー未存在の固定応答を返す。 */
export const userNotFoundResponse =
  (): operations['getUser']['responses'][404]['content']['application/json'] => ({
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  });

/** core内部失敗の固定応答を返す。 */
export const internalErrorResponse = (): InternalErrorResponse => ({
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
});

/** 閉じた失敗型の処理漏れを例外として検出する。 */
export const assertNever = (failure: never): never => {
  throw new Error(`Unhandled users failure: ${String(failure)}`);
};
