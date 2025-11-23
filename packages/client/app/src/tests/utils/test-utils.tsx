import { CssBaseline, ThemeProvider } from '@cfreact-template/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';

import { theme } from '@cfreact-template/ui/theme';

import type { ReactElement, ReactNode } from 'react';

// テスト用の QueryClient を作成（エラーのリトライを無効化）
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
}

// すべてのプロバイダーをラップするコンポーネント
function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

// カスタムレンダー関数
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// すべてのテストユーティリティを再エクスポート
export * from '@testing-library/react';
export { customRender as render };
