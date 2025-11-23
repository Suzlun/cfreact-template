import { CssBaseline, ThemeProvider } from '@cfreact-template/ui';
import { RouterProvider } from 'react-router';

import { QueryProvider } from '@cfreact-template-client/domain';

import { theme } from '@cfreact-template/ui/theme';

import { router } from './router';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ThemeProvider>
  );
}
