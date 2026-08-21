import type { D1Database, KVNamespace, R2Bucket, SendEmail } from '@cloudflare/workers-types';

/**
 * `Cloudflare Workers` が受け取る `Cloudflare` バインディングの集合。
 *
 * @remarks
 * Worker 実行環境が注入する値を型付けする。データ型なので実行時の戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const database = bindings.DB;
 * ```
 */
export interface Bindings {
  /** ユーザー情報を保存する D1 データベース。 */
  DB: D1Database;
  /** Worker 設定から注入され、現在の API 処理では参照しない KV 名前空間。 */
  KV: KVNamespace;
  /** Worker 設定から注入され、現在の API 処理では参照しない R2 バケット。 */
  R2: R2Bucket;
  /** ユーザー作成通知を送信する `Cloudflare Email Workers` バインディング。 */
  EMAIL: SendEmail;
  /** 通知メールの送信元。未設定の場合は通知を送信しない。 */
  EMAIL_FROM?: string;
  /** 通知メールの宛先。未設定の場合は通知を送信しない。 */
  EMAIL_TO?: string;
}
