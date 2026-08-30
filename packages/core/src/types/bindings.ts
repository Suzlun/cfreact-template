import type { D1Database, SendEmail } from '@cloudflare/workers-types';

/** core Workerへ注入するCloudflareバインディング。 */
export interface Bindings {
  /** ユーザー情報を保存するD1データベース。 */
  DB: D1Database;
  /** ユーザー作成通知を送信するCloudflare Emailバインディング。 */
  EMAIL: SendEmail;
  /** 通知メールの送信元。 */
  EMAIL_FROM?: string;
  /** 通知メールの宛先。 */
  EMAIL_TO?: string;
}
