import type { MiddlewareHandler } from 'hono';

type SafeErrorInspection = { safe: true } | { safe: false; cause: unknown };

/**
 * HTTP 応答が安全な JSON エラー契約だけを含むか確認する。
 *
 * @remarks
 * 元の応答本文を消費せず、複製した応答だけを JSON として解析する。解析した本文は返さないため、
 * 呼び出し元が応答検証の詳細を利用者向け本文へ誤って転用することを防ぐ。
 *
 * @param response 検査対象の HTTP 応答。
 * @returns `code` と `message` の文字列だけを持つ場合は安全、その他は内部原因を持つ失敗結果。
 *
 * @example
 * ```ts
 * const inspection = await inspectSafeErrorResponse(response);
 * ```
 */
export const inspectSafeErrorResponse = async (
  response: Response
): Promise<SafeErrorInspection> => {
  let payload: unknown;
  try {
    // 元の本文ストリームを利用者向け応答用に保持し、検査専用の複製だけを解析する。
    payload = await response.clone().json();
  } catch (error) {
    // JSON でない応答は安全な公開エラー契約ではないため、解析失敗を内部ログ用の原因として保持する。
    return { safe: false, cause: error };
  }

  // 検証器の詳細など追加項目を含む本文を拒否し、公開契約の二項目だけを許可する。
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

  // 本文自体を原因へ含めず、契約違反の分類だけをサーバーログへ渡す。
  return {
    safe: false,
    cause: new TypeError('HTTP 400 response did not match the safe JSON error contract'),
  };
};

/**
 * 生成された応答バリデーターの失敗を未処理例外へ変換する。
 *
 * @remarks
 * `Orval` が応答バリデーターをこのミドルウェアの直後へ再生成することで、応答検証が返す不安全な 400 だけを例外へ変換します。
 * リクエストバリデーターはこのミドルウェアの外側へ置くため、入力不正の 400 応答には影響しません。
 * 生成関数自体は引数を取らず、例外や外部副作用を発生させない。返したミドルウェアは後続処理を実行して応答を読む。
 *
 * @returns 応答検証失敗を例外へ変換する外側のミドルウェア。
 * @throws 返したミドルウェアの実行中に、内側の 400 が安全な JSON エラー契約を満たさない場合。
 *
 * @example
 * ```ts
 * guardResponseValidation();
 * zValidator('response', GetExampleResponse);
 * ```
 */
export const guardResponseValidation = (): MiddlewareHandler => {
  return async (c, next) => {
    // 直後の生成応答バリデーターとハンドラーを実行し、確定した応答状態を受け取る。
    await next();

    // 成功応答と 400 以外の契約済み応答は追加解析せず、そのまま外側へ返す。
    if (c.res.status === 400) {
      // 将来追加される正当な 400 は保持し、検証詳細や非 JSON 本文だけを固定 500 応答の経路へ送る。
      const inspection = await inspectSafeErrorResponse(c.res);
      if (!inspection.safe) {
        throw new Error('Generated response validation failed', { cause: inspection.cause });
      }
    }
  };
};
