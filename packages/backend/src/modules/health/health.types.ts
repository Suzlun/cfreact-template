import type { components } from '@cfreact-template/backend/generated/api/openapi';

/**
 * 稼働確認リソースが返す成功応答を表す。
 *
 * @remarks
 * `TypeSpec` から生成された OpenAPI 型をそのまま参照する。型定義なので実行時の戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const response: HealthResponse = {
 *   status: 'ok',
 *   timestamp: '2026-08-20T00:00:00.000Z',
 * };
 * ```
 */
export type HealthResponse = components['schemas']['HealthResponse'];
