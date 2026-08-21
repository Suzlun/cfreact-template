/**
 * `Cloudflare Workers` の入口が利用する、構成済みの `Hono` アプリを公開する。
 *
 * @remarks
 * リクエストを受けるまで外部通信は行わない。処理中の予期しない例外は固定 500 応答へ変換され、
 * 内部原因だけがサーバーログへ記録される。
 *
 * @example
 * ```ts
 * import { server } from '@cfreact-template/backend/app';
 * ```
 */
export { default as server } from './server';
