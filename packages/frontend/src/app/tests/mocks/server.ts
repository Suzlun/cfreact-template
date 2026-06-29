import { setupServer } from 'msw/node';

import { handlers } from '@cfreact-template/frontend/app/tests/mocks/handlers';

/** MSW server instance for client test requests. */
const server = setupServer(...handlers);

export { server };
