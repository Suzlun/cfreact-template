import { createUser, getUser, listUsers } from './generated/client';

/** core APIへ要求を送るWeb標準`fetch`実装。 */
export type CoreFetch = typeof globalThis.fetch;

/** core API SDKの通信設定。 */
export interface CoreSdkConfig {
  /** core APIの基底URL。ネットワーク通信ではHTTPS、ローカル通信ではループバックHTTPだけを許可する。 */
  baseUrl: string | URL;
  /** core APIがバックエンドを認証する不透明なBearerトークン。 */
  token: string;
  /** 実行基盤が提供するWeb標準fetch実装。 */
  fetch: CoreFetch;
}

/** アプリのバックエンドが利用できるcore API操作。 */
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

/** 実行時の接続先と`fetch`だけを利用するcore API SDKを構築する。 */
export const createCoreSdk = ({ baseUrl, token, fetch }: CoreSdkConfig): CoreSdk => {
  const resolvedBaseUrl = new URL(baseUrl);
  const loopbackHttp =
    resolvedBaseUrl.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(resolvedBaseUrl.hostname);
  if (resolvedBaseUrl.protocol !== 'https:' && !loopbackHttp) {
    throw new TypeError('core API base URL must use HTTPS');
  }
  if (resolvedBaseUrl.username !== '' || resolvedBaseUrl.password !== '') {
    throw new TypeError('core API base URL must not contain credentials');
  }
  if (resolvedBaseUrl.search !== '' || resolvedBaseUrl.hash !== '') {
    throw new TypeError('core API base URL must not contain a query or fragment');
  }
  if (token.length < 43 || !/^[\w+./~-]+=*$/.test(token)) {
    throw new TypeError('core API token must be a high-entropy Bearer token');
  }
  if (!resolvedBaseUrl.pathname.endsWith('/')) {
    resolvedBaseUrl.pathname += '/';
  }

  const authenticatedFetch: CoreFetch = async (input, init) => {
    const sourceRequest = input instanceof Request ? new Request(input, init) : undefined;
    const sourceUrlValue =
      input instanceof Request ? input.url : input instanceof URL ? input.href : input;
    const sourceUrl = new URL(sourceUrlValue, 'https://core-sdk.invalid');
    const targetUrl = new URL(
      `${sourceUrl.pathname.replace(/^\//, '')}${sourceUrl.search}`,
      resolvedBaseUrl
    );
    const request = new Request(targetUrl, sourceRequest ?? init);
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(new Request(request, { headers, redirect: 'manual' }));
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      throw new TypeError('core API redirects are not allowed');
    }
    return response;
  };

  return {
    listUsers: (options) => listUsers(options, authenticatedFetch),
    getUser: (id, options) => getUser(id, options, authenticatedFetch),
    createUser: (input, options) => createUser(input, options, authenticatedFetch),
  };
};
