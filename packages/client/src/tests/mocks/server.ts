import { setupServer } from 'msw/node';

import { handlers } from './handlers.js';

// MSW サーバーをセットアップ
export const server = setupServer(...handlers);
