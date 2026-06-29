import { createBrowserRouter } from 'react-router';

import { AppLayout } from '@cfreact-template/frontend/app/components/layout/AppLayout';
import { HomePage } from '@cfreact-template/frontend/app/pages/home/HomePage';
import { UsersPage } from '@cfreact-template/frontend/app/pages/users/UsersPage';

/** App router definition with layout and page routes. */
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
    ],
  },
]);

export { router };
