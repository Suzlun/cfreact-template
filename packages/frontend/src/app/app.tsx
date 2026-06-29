import { RouterProvider } from 'react-router';

import { router } from '@cfreact-template/frontend/app/router';
import { QueryProvider } from '@cfreact-template/frontend/domain';

/** Root application component with data providers and routing. */
function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export { App };
