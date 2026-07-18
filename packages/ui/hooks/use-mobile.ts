import * as React from 'react';

import { createMobileViewportStore, getServerMobileViewportSnapshot } from './use-mobile-store';

/**
 * 現在の viewport が共有 UI のモバイル表示条件に一致するかを返す。
 * Hook インスタンスの初回クライアント描画と SSR は false を返し、購読開始後に
 * matchMedia の現在値へ同期することで既存の初回 DOM 分岐契約を維持する。
 *
 * @returns viewport 幅が 768px 未満の場合は true、それ以外は false。
 * @throws 購読開始時に標準の window.matchMedia が提供されていないブラウザでは同期に失敗する。
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * ```
 */
export function useIsMobile(): boolean {
  // lazy initializer により Hook インスタンス専用 store を一度だけ生成し、render 中の ref 操作を避ける。
  const [store] = React.useState(createMobileViewportStore);

  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerMobileViewportSnapshot
  );
}
