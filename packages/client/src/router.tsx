import { createBrowserRouter } from 'react-router';

import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/home/HomePage';
import { UsersPage } from './pages/users/UsersPage';

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
