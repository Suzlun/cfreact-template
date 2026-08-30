import { createUser, getUser, listUsers } from './generated/client';

/** core APIへ要求を送るWeb標準fetch実装。 */
export type CoreFetch = typeof globalThis.fetch;

/** app backendが利用できるcore API操作。 */
export interface CoreSdk {
  /** ユーザー一覧を取得する。 */
  listUsers: (options?: RequestInit) => ReturnType<typeof listUsers>;
  /** ユーザーを一件取得する。 */
  getUser: (id: string, options?: RequestInit) => ReturnType<typeof getUser>;
  /** ユーザーを作成する。 */
  createUser: (
    input: Parameters<typeof createUser>[0],
    options?: RequestInit
  ) => ReturnType<typeof createUser>;
}

/** 注入されたfetchだけを利用するcore API SDKを構築する。 */
export const createCoreSdk = (fetch: CoreFetch): CoreSdk => ({
  listUsers: (options) => listUsers(options, fetch),
  getUser: (id, options) => getUser(id, options, fetch),
  createUser: (input, options) => createUser(input, options, fetch),
});
