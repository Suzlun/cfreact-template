import type { FailureLogger } from '@cfreact-template/core/types';

/** core内部の失敗を利用者向け応答から分離して記録する。 */
export const logFailure: FailureLogger = (event, cause): void => {
  console.error(`[core] ${event}`, cause);
};
