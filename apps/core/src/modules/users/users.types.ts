import type { components } from '@cfreact-template/core/generated/api/openapi';

/**
 * 利用者リソースが返すユーザーを表す。
 *
 * @remarks
 * `TypeSpec` から生成した OpenAPI 型を参照し、`UsersService` と `UsersRepository` が HTTP 生成物へ直接依存しないための
 * モジュール内共有型として利用する。型別名なので実行時の戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const user: User = {
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   name: 'Ada',
 *   email: 'ada@example.com',
 *   createdAt: '2026-08-20T00:00:00.000Z',
 * };
 * ```
 */
export type User = components['schemas']['User'];

/**
 * 利用者リソースのユーザー作成入力を表す。
 *
 * @remarks
 * API 契約と同じ名前・メールアドレスの形状を `UsersService` へ渡す。型別名なので実行時の副作用とエラーは
 * 発生しない。メールアドレスの構文は生成された検証処理、業務上の空白規則は `UsersService` が検証する。
 *
 * @example
 * ```ts
 * const input: CreateUserInput = { name: 'Ada', email: 'ada@example.com' };
 * ```
 */
export type CreateUserInput = components['schemas']['CreateUserInput'];

/**
 * 利用者リソースでユーザーを識別する ULID 文字列を表す。
 *
 * @remarks
 * API 契約の識別子型を処理担当、`UsersService`、`UsersRepository` の間で共有する。型別名なので実行時の戻り値、
 * 例外、副作用はなく、文字列形式の検証は生成された検証処理が担当する。
 *
 * @example
 * ```ts
 * const id: UserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
 * ```
 */
export type UserId = components['schemas']['UserId'];
