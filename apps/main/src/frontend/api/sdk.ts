import {
  createUser,
  getHello,
  getUser,
  listUsers,
  type CreateUserInput,
  type getHelloResponse,
} from '@cfreact-template/main/frontend/api/generated';

export type {
  CreateUserInput,
  HelloResponse,
  User,
  InternalError,
  InvalidRequestError,
  UserEmailAlreadyExistsError,
  UserNotFoundError,
  createUserResponse,
  getHelloResponse,
  getUserResponse,
  listUsersResponse,
} from '@cfreact-template/main/frontend/api/generated';

/**
 * API SDK の全リクエストへ適用する既定設定。
 *
 * @example
 * ```ts
 * createApiSdk({ defaultInit: { credentials: 'same-origin' } });
 * ```
 */
interface ApiSdkConfig {
  /** 各呼び出しの個別設定より先に適用する `RequestInit`。 */
  defaultInit?: RequestInit;
}

/**
 * `HeadersInit` を、上書き可能な単純オブジェクトへ正規化する。
 *
 * @param headers - `Headers`、キー値配列、またはオブジェクト形式のヘッダー。未指定も許可する。
 * @returns 大文字小文字などをブラウザー標準の `Headers` で正規化したキー値。
 */
const toHeaderObject = (headers?: HeadersInit): Record<string, string> => {
  if (headers == null) {
    // 未指定時は後続のオブジェクト結合で扱える空のヘッダーを返す。
    return {};
  }

  // 型変換に頼らず、ブラウザー標準の `Headers` で全形式を同じ表現へ正規化する。
  const normalized = new Headers(headers);
  return Object.fromEntries(normalized.entries());
};

/**
 * SDK 全体の既定設定と、個別呼び出しの設定を安全に結合する。
 *
 * @param init - 個別の API 呼び出しが指定した設定。
 * @param defaultInit - SDK 生成時に指定された既定設定。
 * @returns 個別設定を優先し、ヘッダーだけは両方を保持した `RequestInit`。
 */
const withDefaultInit = (init: RequestInit | undefined, defaultInit: RequestInit | undefined) => {
  if (defaultInit == null) {
    // 既定設定がなければ、呼び出し側の設定を変更せず生成 SDK へ渡す。
    return init;
  }

  // 一般設定は個別指定を優先し、ヘッダーは正規化後にキー単位で上書きする。
  return {
    ...defaultInit,
    ...init,
    headers: {
      ...toHeaderObject(defaultInit.headers),
      ...toHeaderObject(init?.headers),
    },
  };
};

/**
 * 生成済み API 関数を用途別にまとめ、共通のリクエスト設定を適用する SDK を生成する。
 *
 * @param config - 全 API 呼び出しへ適用する任意の既定設定。
 * @returns 生成コードの状態番号と本文の判別可能な共用体を保持した API 操作群。
 */
const createApiSdk = (config?: ApiSdkConfig) => {
  // 呼び出しごとに同じ任意参照を繰り返さないよう、既定設定を一度だけ取り出す。
  const defaultInit = config?.defaultInit;

  return {
    hello: {
      // 挨拶取得へ個別設定と既定設定を結合して渡す。
      get: (options?: RequestInit): Promise<getHelloResponse> =>
        getHello(withDefaultInit(options, defaultInit)),
    },
    users: {
      // ユーザー一覧取得へ個別設定と既定設定を結合して渡す。
      list: (options?: RequestInit) => listUsers(withDefaultInit(options, defaultInit)),
      // JSON 本文の Content-Type を保証しつつ、呼び出し側の追加ヘッダーを維持する。
      create: (payload: CreateUserInput, options?: RequestInit) =>
        createUser(
          payload,
          withDefaultInit(
            {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                ...toHeaderObject(options?.headers),
              },
            },
            defaultInit
          )
        ),
      // ユーザー ID と結合済み設定を単一ユーザー取得へ渡す。
      get: (id: string, options?: RequestInit) =>
        getUser(id, withDefaultInit(options, defaultInit)),
    },
  };
};

export type { ApiSdkConfig };
export { createApiSdk };
