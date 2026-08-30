import type { Fetcher, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

/**
 * `Cloudflare Workers` が受け取る `Cloudflare` バインディングの集合。
 *
 * @remarks
 * Worker 実行環境が注入する値を型付けする。データ型なので実行時の戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const core = bindings.CORE_API;
 * ```
 */
export interface Bindings {
  /** 共有業務を提供する非公開core Worker。 */
  CORE_API: Fetcher;
  /** Worker 設定から注入され、現在の API 処理では参照しない KV 名前空間。 */
  KV: KVNamespace;
  /** Worker 設定から注入され、現在の API 処理では参照しない R2 バケット。 */
  R2: R2Bucket;
}
