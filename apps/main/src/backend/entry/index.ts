/**
 * `Cloudflare Workers` が呼び出す既定の実行入口を公開する。
 *
 * @remarks
 * 入力と戻り値は `Hono` の `Cloudflare Workers` 契約に従う。リクエスト処理ではデータベース、メール、ログの副作用が
 * 発生し得る。予期しない例外はアプリ側で安全な 500 応答へ変換される。
 *
 * @example
 * ```ts
 * import worker from '@cfreact-template/main/backend';
 * ```
 */
export { server as default } from '@cfreact-template/main/backend/app';
