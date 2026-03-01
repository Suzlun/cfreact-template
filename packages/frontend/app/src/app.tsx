import { RouterProvider } from 'react-router';

import { QueryProvider } from '@cfreact-template-frontend/domain';
import { CssBaseline, ThemeProvider } from '@cfreact-template-frontend/ui';
import { theme } from '@cfreact-template-frontend/ui/theme';

import { router } from './router';

/** Root application component with theme and routing. */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ThemeProvider>
  );
}

export { App };
