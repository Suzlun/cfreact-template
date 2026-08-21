/**
 * 業務モジュールからメール基盤へ渡す公開メール型。
 *
 * @remarks
 * 型の再公開なので実行時の引数、戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * import type { EmailPayload } from '@cfreact-template/backend/types';
 * ```
 */
export type { EmailPayload } from './email';

/**
 * `Cloudflare Workers` 実行環境が注入する公開バインディング型。
 *
 * @remarks
 * 型の再公開なので実行時の引数、戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * import type { Bindings } from '@cfreact-template/backend/types';
 * ```
 */
export type { Bindings } from './bindings';

/**
 * 予期される結果と内部失敗記録に使う公開共有型。
 *
 * @remarks
 * 型の再公開なので実行時の引数、戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * import type { FailureLogger, Result } from '@cfreact-template/backend/types';
 * ```
 */
export type { FailureLogger, Result } from './result';
