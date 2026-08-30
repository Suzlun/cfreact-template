import { createCoreSdk } from '@cfreact-template/core-sdk';

import type { Bindings } from '@cfreact-template/main/backend/types';

/** Cloudflareバインディングからmain backendが利用する依存を構築する。 */
export const createServices = (
  bindings: Bindings
): { coreSdk: ReturnType<typeof createCoreSdk> } => {
  if (bindings.CORE_API_TOKEN === undefined) {
    throw new Error('CORE_API_TOKEN is required');
  }
  const fetchCore: typeof globalThis.fetch = (input, init) => {
    return bindings.CORE_API.fetch(new Request(input, init));
  };

  return {
    coreSdk: createCoreSdk({
      // Service Bindingが接続先を決めるため、URLは標準`Request`の経路解決だけに使う。
      baseUrl: 'https://core.internal',
      token: bindings.CORE_API_TOKEN,
      fetch: fetchCore,
    }),
  };
};
