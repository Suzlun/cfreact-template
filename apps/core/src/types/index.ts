/** core Workerへ注入するバインディング型。 */
export type { Bindings } from './bindings';

/** 業務モジュールからメール基盤へ渡すメール型。 */
export type { EmailPayload } from './email';

/** 予期される結果と内部失敗記録に使う共有型。 */
export type { FailureLogger, Result } from './result';
