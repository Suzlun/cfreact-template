import { createCoreSdk } from '@cfreact-template/core-sdk';

import type { Bindings } from '@cfreact-template/main/backend/types';

/** Cloudflareバインディングからmain backendが利用する依存を構築する。 */
export const createServices = (
  bindings: Bindings
): { coreSdk: ReturnType<typeof createCoreSdk> } => {
  const fetchCore: typeof globalThis.fetch = (input, init) => {
    return bindings.CORE_API.fetch(new Request(input, init));
  };

  return { coreSdk: createCoreSdk(fetchCore) };
};
