import { RouterProvider } from 'react-router';

import { router } from '@cfreact-template/main/frontend/app/router';
import { QueryProvider } from '@cfreact-template/main/frontend/domain';

/** Root application component with data providers and routing. */
function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export { App };
