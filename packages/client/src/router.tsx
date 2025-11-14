import { createBrowserRouter } from 'react-router';

import { AppLayout } from './components/layout/AppLayout.js';
import { HomePage } from './pages/HomePage.js';
import { UsersPage } from './pages/UsersPage.js';

export const router = createBrowserRouter([
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
