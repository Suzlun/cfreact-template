import { extendZodWithOpenApi } from '@hono/zod-openapi';
import { z } from 'zod';

import {
  USER_ID_ULID_PATTERN,
  USER_ID_ULID_PATTERN_SOURCE,
} from '@cfreact-template/backend/domain';

extendZodWithOpenApi(z);

/** 標準エラーレスポンスのJSON payload。 */
const errorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi('ErrorResponse');

/** 接続確認用のHelloレスポンスpayload。 */
const helloResponseSchema = z
  .object({
    message: z.string(),
    timestamp: z.iso.datetime(),
  })
  .openapi('HelloResponse');

/** APIが返すユーザーレスポンスpayload。 */
const userResponseSchema = z
  .object({
    id: z.string().regex(USER_ID_ULID_PATTERN).openapi({
      type: 'string',
      format: 'ulid',
      pattern: USER_ID_ULID_PATTERN_SOURCE,
      example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    }),
    name: z.string(),
    email: z.string().openapi({ format: 'email' }),
    createdAt: z.iso.datetime(),
  })
  .openapi('User');

/** ユーザー作成APIが受け取る入力payload。 */
const createUserInputSchema = z
  .object({
    name: z.string(),
    email: z.string().openapi({ format: 'email' }),
  })
  .openapi('CreateUserInput');

/** 単一ユーザーAPIが受け取るULIDパスパラメータ。 */
const userIdParamsSchema = z.object({
  id: z.string().regex(USER_ID_ULID_PATTERN, 'Invalid id').openapi({
    type: 'string',
    format: 'ulid',
    pattern: USER_ID_ULID_PATTERN_SOURCE,
    example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  }),
});

/** ユーザー一覧APIが返すレスポンスpayload。 */
const usersListResponseSchema = z.array(userResponseSchema);

export {
  createUserInputSchema,
  errorResponseSchema,
  helloResponseSchema,
  userIdParamsSchema,
  userResponseSchema,
  usersListResponseSchema,
};
