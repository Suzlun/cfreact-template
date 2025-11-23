import { setupServer } from 'msw/node';

import { handlers } from './handlers';

// MSW サーバーをセットアップ
export const server = setupServer(...handlers);
