import type { components } from '@cfreact-template/backend/generated/api/openapi';

/**
 * 挨拶リソースが返す成功応答を表す。
 *
 * @remarks
 * `TypeSpec` から生成された OpenAPI 型をそのまま参照する。型定義なので実行時の戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const response: HelloResponse = {
 *   message: 'Hello from Hono + Cloudflare Workers',
 *   timestamp: '2026-08-20T00:00:00.000Z',
 * };
 * ```
 */
export type HelloResponse = components['schemas']['HelloResponse'];
