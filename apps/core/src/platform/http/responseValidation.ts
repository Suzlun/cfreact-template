import type { MiddlewareHandler } from 'hono';

type SafeErrorInspection = { safe: true } | { safe: false; cause: unknown };

/** HTTP応答が安全なJSONエラー契約だけを含むか確認する。 */
export const inspectSafeErrorResponse = async (
  response: Response
): Promise<SafeErrorInspection> => {
  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch (error) {
    return { safe: false, cause: error };
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    !Array.isArray(payload) &&
    Object.keys(payload).length === 2 &&
    'code' in payload &&
    typeof payload.code === 'string' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return { safe: true };
  }

  return {
    safe: false,
    cause: new TypeError('HTTP 400 response did not match the safe JSON error contract'),
  };
};

/** 生成された応答検証の不安全な400を未処理例外へ変換する。 */
export const guardResponseValidation = (): MiddlewareHandler => {
  return async (c, next) => {
    await next();
    if (c.res.status !== 400) {
      return;
    }

    const inspection = await inspectSafeErrorResponse(c.res);
    if (!inspection.safe) {
      throw new Error('Generated response validation failed', { cause: inspection.cause });
    }
  };
};
