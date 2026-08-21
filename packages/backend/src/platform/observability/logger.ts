import type { FailureLogger } from '@cfreact-template/backend/types';

/**
 * API 応答へ含めてはいけない内部失敗をサーバーログへ記録する。
 *
 * @remarks
 * `console.error` へ一件記録する副作用を持つ。値は返さず、この実装自身は意図的な例外を送出しない。
 *
 * @param event 固定された失敗分類。
 * @param cause スタックや内部情報を含み得る記録対象。
 * @returns なし。利用者へは安全な固定メッセージだけを返す。
 *
 * @example
 * ```ts
 * logFailure('users.list.persistence-failure', error);
 * ```
 */
export const logFailure: FailureLogger = (event, cause): void => {
  // 原因は運用観測へ残すが、ハンドラーがこの値を HTTP 応答本文に流用しないよう境界を分ける。
  console.error(`[backend] ${event}`, cause);
};
