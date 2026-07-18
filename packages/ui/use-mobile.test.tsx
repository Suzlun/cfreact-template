import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIsMobile } from '@cfreact-template/ui/hooks/use-mobile';

import {
  createMobileViewportStore,
  getServerMobileViewportSnapshot,
} from './hooks/use-mobile-store';

type MediaChangeListener = (event: MediaQueryListEvent) => void;

/**
 * matchMedia の現在値、change 通知、購読解除をテストから制御する。
 *
 * @param initialMatches 初回 snapshot で返すメディア条件の一致状態。
 * @returns matchMedia mock と状態変更操作、および listener の監視関数。
 */
function createMatchMediaController(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<MediaChangeListener>();
  const addEventListener = vi.fn((_type: string, listener: MediaChangeListener) => {
    listeners.add(listener);
  });
  const removeEventListener = vi.fn((_type: string, listener: MediaChangeListener) => {
    listeners.delete(listener);
  });

  // 実装が利用する MediaQueryList の公開面だけを再現し、表示結果と購読契約を検証する。
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: '(max-width: 767px)',
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;
  const matchMedia = vi.fn((_query: string) => mediaQueryList);

  return {
    addEventListener,
    matchMedia,
    removeEventListener,
    setMatches(nextMatches: boolean) {
      // browser の判定値を先に更新してから change を通知し、React に最新 snapshot を読ませる。
      matches = nextMatches;
      const event = { matches, media: mediaQueryList.media } as MediaQueryListEvent;
      for (const listener of listeners) listener(event);
    },
  };
}

/**
 * useIsMobile の真偽値を利用者が確認できる文字列へ変換するテスト用コンポーネント。
 *
 * @returns hook の現在値を保持する output 要素。
 */
function MobileState() {
  const isMobile = useIsMobile();
  return <output>{isMobile ? 'mobile' : 'desktop'}</output>;
}

afterEach(() => {
  // 各テストが差し替えた matchMedia を戻し、別テストの初期 snapshot へ影響させない。
  vi.unstubAllGlobals();
});

describe('mobile viewport store', () => {
  it('購読前はfalseを返し、購読後だけ現在値とchange通知を反映してcleanupする', () => {
    const controller = createMatchMediaController(true);
    vi.stubGlobal('matchMedia', controller.matchMedia);

    // store 生成と SSR snapshot 取得では window を読まず、旧契約の false を維持する。
    const store = createMobileViewportStore();
    expect(store.getSnapshot()).toBe(false);
    expect(getServerMobileViewportSnapshot()).toBe(false);
    expect(controller.matchMedia).not.toHaveBeenCalled();

    // listener 登録後に現在の matches=true を取り込み、値が変わったため一度だけ通知する。
    const onStoreChange = vi.fn();
    const unsubscribe = store.subscribe(onStoreChange);
    expect(controller.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    expect(controller.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(store.getSnapshot()).toBe(true);
    expect(onStoreChange).toHaveBeenCalledOnce();

    // 同値の change では通知せず、false への実変更だけを同じ更新経路で通知する。
    controller.setMatches(true);
    expect(onStoreChange).toHaveBeenCalledOnce();
    controller.setMatches(false);
    expect(store.getSnapshot()).toBe(false);
    expect(onStoreChange).toHaveBeenCalledTimes(2);

    // cleanup は登録時と同じ listener を外し、その後の change を store へ伝えない。
    const subscribedListener = controller.addEventListener.mock.calls[0]?.[1];
    unsubscribe();
    expect(controller.removeEventListener).toHaveBeenCalledWith('change', subscribedListener);
    controller.setMatches(true);
    expect(store.getSnapshot()).toBe(false);
    expect(onStoreChange).toHaveBeenCalledTimes(2);
  });
});

describe('useIsMobile', () => {
  it('初回snapshotを描画し、change通知を反映して購読を解除する', () => {
    const controller = createMatchMediaController(false);
    vi.stubGlobal('matchMedia', controller.matchMedia);

    // 購読後も matches=false の場合はクライアント表示が desktop のまま変化しない。
    const { unmount } = render(<MobileState />);
    expect(screen.getByText('desktop')).toBeInTheDocument();
    expect(controller.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');

    // MediaQueryList の change 通知だけで表示値が更新されることを確認する。
    act(() => {
      controller.setMatches(true);
    });
    expect(screen.getByText('mobile')).toBeInTheDocument();

    // unmount 時に登録時と同じ listener が解除され、以後の通知対象から外れることを確認する。
    const subscribedListener = controller.addEventListener.mock.calls[0]?.[1];
    unmount();
    expect(controller.removeEventListener).toHaveBeenCalledWith('change', subscribedListener);
  });

  it('SSRではブラウザsnapshotを読まずfalseを返す', () => {
    const controller = createMatchMediaController(true);
    vi.stubGlobal('matchMedia', controller.matchMedia);

    // server renderer は getServerSnapshot を使用し、viewport に依存せず desktop を生成する。
    expect(renderToString(<MobileState />)).toContain('desktop');
    expect(controller.matchMedia).not.toHaveBeenCalled();
  });
});
