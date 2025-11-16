import { ChakraProvider } from '@cfreact-template/ui';
import { system } from '@cfreact-template/ui/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';

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
    logger: {
      log: () => void 0,
      warn: () => void 0,
      error: () => void 0,
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
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ChakraProvider>
  );
}

// カスタムレンダー関数
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// すべてのテストユーティリティを再エクスポート
export * from '@testing-library/react';
export { customRender as render };
