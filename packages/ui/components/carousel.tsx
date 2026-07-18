'use client';

import * as React from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';

import { cn } from '@cfreact-template/ui/lib/utils';
import { Button } from '@cfreact-template/ui/components/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];
type CarouselScrollSnapshot = 'both' | 'next' | 'none' | 'previous';

const EMPTY_CAROUSEL_SCROLL_SNAPSHOT: CarouselScrollSnapshot = 'none';

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

/**
 * Embla API の移動可否を参照同一性が安定した文字列 snapshot へ変換する。
 *
 * @param api 現在の Embla API。初期化前は undefined。
 * @returns 前後の移動可否を表す外部ストア snapshot。
 */
function getCarouselScrollSnapshot(api: CarouselApi): CarouselScrollSnapshot {
  // Embla 初期化前は両ボタンを無効にする既存状態を維持する。
  if (!api) return EMPTY_CAROUSEL_SCROLL_SNAPSHOT;

  // 一度の snapshot 取得で前後両方の可否を読み、同じ Embla 状態から結果を確定する。
  const canScrollPrev = api.canScrollPrev();
  const canScrollNext = api.canScrollNext();

  if (canScrollPrev && canScrollNext) return 'both';
  if (canScrollPrev) return 'previous';
  if (canScrollNext) return 'next';
  return EMPTY_CAROUSEL_SCROLL_SNAPSHOT;
}

/**
 * SSR 中に利用する Carousel の固定 snapshot を返す。
 *
 * @returns Embla が存在しない初期状態を表す none。
 */
function getServerCarouselScrollSnapshot(): CarouselScrollSnapshot {
  return EMPTY_CAROUSEL_SCROLL_SNAPSHOT;
}

/**
 * Embla の選択位置と再初期化を React の外部ストアとして購読する。
 *
 * @param api 購読対象の Embla API。初期化前は undefined。
 * @returns 現在の前後移動可否を表す安定した snapshot。
 */
function useCarouselScrollSnapshot(api: CarouselApi): CarouselScrollSnapshot {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      // API 初期化前はイベント源がないため、何も解除しない関数を返して契約を満たす。
      if (!api) return () => undefined;

      // 選択位置の変更と再初期化のどちらでも、React に最新 snapshot の取得を依頼する。
      api.on('select', onStoreChange);
      api.on('reInit', onStoreChange);

      return () => {
        // 登録した両イベントを同じ callback で解除し、破棄後の通知を防止する。
        api.off('select', onStoreChange);
        api.off('reInit', onStoreChange);
      };
    },
    [api]
  );

  const getSnapshot = React.useCallback(() => getCarouselScrollSnapshot(api), [api]);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerCarouselScrollSnapshot);
}

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    plugins
  );
  const scrollSnapshot = useCarouselScrollSnapshot(api);
  const canScrollPrev = scrollSnapshot === 'previous' || scrollSnapshot === 'both';
  const canScrollNext = scrollSnapshot === 'next' || scrollSnapshot === 'both';

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation: orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
      <div
        className={cn('flex', orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', className)}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        className
      )}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = 'outline',
  size = 'icon-sm',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        'absolute touch-manipulation rounded-full',
        orientation === 'horizontal'
          ? 'inset-y-0 -left-12 my-auto'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = 'outline',
  size = 'icon-sm',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        'absolute touch-manipulation rounded-full',
        orientation === 'horizontal'
          ? 'inset-y-0 -right-12 my-auto'
          : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRightIcon />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
};
