import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@cfreact-template/ui/components/carousel';

type EmblaEventName = 'reInit' | 'select';
type EmblaListener = () => void;

const emblaMock = vi.hoisted(() => {
  const listeners = new Map<EmblaEventName, Set<EmblaListener>>([
    ['reInit', new Set<EmblaListener>()],
    ['select', new Set<EmblaListener>()],
  ]);
  const snapshot = { canScrollNext: false, canScrollPrev: false };
  const api = {
    canScrollNext: vi.fn(() => snapshot.canScrollNext),
    canScrollPrev: vi.fn(() => snapshot.canScrollPrev),
    off: vi.fn((eventName: EmblaEventName, listener: EmblaListener) => {
      listeners.get(eventName)?.delete(listener);
    }),
    on: vi.fn((eventName: EmblaEventName, listener: EmblaListener) => {
      listeners.get(eventName)?.add(listener);
    }),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
  };
  const viewportRef = vi.fn();

  return {
    api,
    emit(eventName: EmblaEventName) {
      // Embla と同じく登録済み listener へイベントを通知し、外部ストアの再取得を開始する。
      for (const listener of listeners.get(eventName) ?? []) listener();
    },
    listeners,
    snapshot,
    viewportRef,
  };
});

vi.mock('embla-carousel-react', () => ({
  default: vi.fn(() => [emblaMock.viewportRef, emblaMock.api]),
}));

beforeEach(() => {
  // 各ケースを Embla の先頭位置と未購読状態から開始し、呼び出し履歴も分離する。
  emblaMock.snapshot.canScrollPrev = false;
  emblaMock.snapshot.canScrollNext = false;
  emblaMock.listeners.get('select')?.clear();
  emblaMock.listeners.get('reInit')?.clear();
  vi.clearAllMocks();
});

describe('Carousel', () => {
  it('Emblaの初回snapshotとselect・reInit通知をボタン状態へ反映する', () => {
    emblaMock.snapshot.canScrollNext = true;

    // 利用者が操作する既存 Carousel 構成を描画し、初回 snapshot と setApi 通知を確認する。
    const setApi = vi.fn();
    render(
      <Carousel setApi={setApi}>
        <CarouselContent>
          <CarouselItem>First slide</CarouselItem>
          <CarouselItem>Second slide</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );

    const previousButton = screen.getByRole('button', { name: 'Previous slide' });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeEnabled();
    expect(setApi).toHaveBeenCalledWith(emblaMock.api);

    // select 後の移動可否を公開ボタン状態で確認し、内部 state 実装へ依存しないようにする。
    act(() => {
      emblaMock.snapshot.canScrollPrev = true;
      emblaMock.snapshot.canScrollNext = false;
      emblaMock.emit('select');
    });
    expect(previousButton).toBeEnabled();
    expect(nextButton).toBeDisabled();

    // reInit でも同じ外部 snapshot が再取得され、両方向の状態が更新されることを確認する。
    act(() => {
      emblaMock.snapshot.canScrollPrev = true;
      emblaMock.snapshot.canScrollNext = true;
      emblaMock.emit('reInit');
    });
    expect(previousButton).toBeEnabled();
    expect(nextButton).toBeEnabled();

    // 既存の左右キー操作が Embla の移動 API を呼び続けることを確認する。
    const region = screen.getByRole('region');
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(emblaMock.api.scrollPrev).toHaveBeenCalledOnce();
    expect(emblaMock.api.scrollNext).toHaveBeenCalledOnce();
  });

  it('unmount時にselectとreInitの購読を両方解除する', () => {
    const { unmount } = render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Only slide</CarouselItem>
        </CarouselContent>
      </Carousel>
    );

    // 描画中は各 Embla イベントに外部ストアの listener が1つずつ存在する。
    expect(emblaMock.listeners.get('select')).toHaveLength(1);
    expect(emblaMock.listeners.get('reInit')).toHaveLength(1);

    // 破棄後は両方の listener が除去され、Carousel へ通知が残らない。
    unmount();
    expect(emblaMock.listeners.get('select')).toHaveLength(0);
    expect(emblaMock.listeners.get('reInit')).toHaveLength(0);
  });
});
