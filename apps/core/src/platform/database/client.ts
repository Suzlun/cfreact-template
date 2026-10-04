import { drizzle } from 'drizzle-orm/d1';

import type { Bindings } from '@cfreact-template/core/types';

/**
 * D1 用 Drizzle クライアントの型。
 *
 * @remarks
 * `D1` バインディングの具体型から導出し、`UsersRepository` が接続生成の詳細を再実装しないようにする。
 * 型定義なので実行時の戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * let database: DrizzleClient;
 * ```
 */
export type DrizzleClient = ReturnType<typeof drizzle>;

/**
 * `Cloudflare D1` バインディングから `Drizzle` クライアントを生成する。
 *
 * @remarks
 * クライアントを構築するだけで SQL やネットワーク処理は実行せず、通常は例外を送出しない。
 *
 * @param database アプリケーションが受け取った D1 データベース。
 * @returns リポジトリが利用する `Drizzle` クライアント。
 *
 * @example
 * ```ts
 * const database = createDatabaseClient(bindings.DB);
 * ```
 */
export const createDatabaseClient = (database: Bindings['DB']): DrizzleClient => {
  // `D1` への接続設定は構成起点から一度だけ渡し、各リポジトリがバインディングを直接扱わないようにする。
  return drizzle(database);
};
