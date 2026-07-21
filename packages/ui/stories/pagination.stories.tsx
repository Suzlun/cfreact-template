import { expect, fn, userEvent, within } from 'storybook/test';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@cfreact-template/ui/components/pagination';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent } from 'react';

/** Pagination の固定ページまたは省略位置を表す Story 専用データ。 */
type PaginationEntry =
  | {
      /** 描画と React key の両方に使う Story 内で一意の識別子。 */
      id: string;
      /** 遷移可能な固定ページであることを示す識別子。 */
      kind: 'page';
      /** 可視ラベル、アクセシブル名、fragment URL に使う固定ページ番号。 */
      page: number;
    }
  | {
      /** 描画と React key の両方に使う Story 内で一意の識別子。 */
      id: string;
      /** 中間ページを省略していることを示す識別子。 */
      kind: 'ellipsis';
    };

/** 固定ページを Pagination の全体構造へ描画する Story 専用契約。 */
interface PaginationCatalogProps {
  /** nav 要素を同一画面内でも識別できるアクセシブル名。 */
  ariaLabel: string;
  /** 現在ページとして `aria-current="page"` を付与する固定番号。 */
  currentPage: number;
  /** 表示順を保持する固定ページと省略位置。 */
  entries: readonly PaginationEntry[];
  /** 次ページ番号。未指定の場合は末尾の操作不可状態を表す。 */
  nextPage?: number;
  /** 前ページ番号。未指定の場合は先頭の操作不可状態を表す。 */
  previousPage?: number;
  /** 前後操作を icon-only にし、狭幅向けの均等配置へ切り替える。 */
  compact?: boolean;
}

/** 全 subcomponent、現在ページ、省略表示を一度に確認する固定ページ。 */
const allSubcomponentEntries = [
  { id: 'page-1', kind: 'page', page: 1 },
  { id: 'page-2', kind: 'page', page: 2 },
  { id: 'page-3', kind: 'page', page: 3 },
  { id: 'page-4', kind: 'page', page: 4 },
  { id: 'ellipsis-after-4', kind: 'ellipsis' },
  { id: 'page-10', kind: 'page', page: 10 },
] as const satisfies readonly PaginationEntry[];

/** 先頭ページの active 状態と Previous の操作不可状態を確認する固定ページ。 */
const firstPageEntries = [
  { id: 'page-1', kind: 'page', page: 1 },
  { id: 'page-2', kind: 'page', page: 2 },
  { id: 'page-3', kind: 'page', page: 3 },
  { id: 'ellipsis-after-3', kind: 'ellipsis' },
  { id: 'page-10', kind: 'page', page: 10 },
] as const satisfies readonly PaginationEntry[];

/** 末尾ページの active 状態と Next の操作不可状態を確認する固定ページ。 */
const lastPageEntries = [
  { id: 'page-1', kind: 'page', page: 1 },
  { id: 'ellipsis-before-8', kind: 'ellipsis' },
  { id: 'page-8', kind: 'page', page: 8 },
  { id: 'page-9', kind: 'page', page: 9 },
  { id: 'page-10', kind: 'page', page: 10 },
] as const satisfies readonly PaginationEntry[];

/** 狭幅では前後移動と現在ページだけを保つ固定ページ。 */
const mobileCompactEntries = [
  { id: 'page-5', kind: 'page', page: 5 },
] as const satisfies readonly PaginationEntry[];

/** `aria-disabled` を見た目と pointer 操作の両方へ反映する既存 utility の組み合わせ。 */
const disabledLinkClassName = 'aria-disabled:pointer-events-none aria-disabled:opacity-50';

/**
 * PaginationLink のクリックを Story 上で観測しつつ、fragment navigation を発生させない。
 *
 * @param event Pagination の実アンカーから通知される React click event。
 * @returns 戻り値はなく、既定遷移を抑止した後に Storybook の spy が呼び出しを記録する。
 */
const paginationLinkClick = fn((event: MouseEvent<HTMLAnchorElement>): void => {
  // アンカーの semantics と通常の click 経路を保ち、Story canvas の URL だけは変更しない。
  event.preventDefault();
});

/**
 * 操作不可の Previous または Next が programmatic click を受けても遷移させない。
 *
 * @param event 操作不可状態の実アンカーから通知される React click event。
 * @returns 戻り値はなく、既定遷移だけを抑止してページ選択処理は通知しない。
 */
function preventDisabledPaginationNavigation(event: MouseEvent<HTMLAnchorElement>): void {
  // `aria-disabled` と pointer-events に加え、直接発火された click の既定遷移も確実に止める。
  event.preventDefault();
}

/**
 * 固定ページ番号を外部通信のない Story 内 fragment URL へ変換する。
 *
 * @param page 遷移先として表す固定ページ番号。
 * @returns Story 文書内だけを指す PaginationLink 用 fragment URL。
 */
function getPaginationHref(page: number): string {
  return `#pagination-page-${String(page)}`;
}

/**
 * 固定ページを Pagination の nav、list、item、link 構造へ変換する。
 *
 * @param props.ariaLabel nav 要素を識別するアクセシブル名。
 * @param props.currentPage active 状態を付与する固定ページ番号。
 * @param props.entries 表示順を保持する固定ページと省略位置。
 * @param props.nextPage 次ページ番号。未指定時は Next を操作不可にする。
 * @param props.previousPage 前ページ番号。未指定時は Previous を操作不可にする。
 * @param props.compact 狭幅向け icon-only 配置へ切り替える指定。
 * @returns Pagination の全 subcomponent を正しい親子構造で組み合わせた navigation。
 */
function PaginationCatalog({
  ariaLabel,
  compact = false,
  currentPage,
  entries,
  nextPage,
  previousPage,
}: PaginationCatalogProps) {
  // 境界ページでは番号の欠如を操作不可状態として扱い、表示データから状態を推測しない。
  const previousDisabled = previousPage === undefined;
  const nextDisabled = nextPage === undefined;

  return (
    <Pagination aria-label={ariaLabel}>
      <PaginationContent className={compact ? 'w-full justify-between' : undefined}>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={previousDisabled ? true : undefined}
            aria-label="前のページへ"
            className={previousDisabled ? disabledLinkClassName : undefined}
            href={getPaginationHref(previousPage ?? currentPage)}
            onClick={previousDisabled ? preventDisabledPaginationNavigation : paginationLinkClick}
            role="link"
            size={compact ? 'icon' : 'default'}
            tabIndex={previousDisabled ? -1 : undefined}
            text={compact ? '' : '前へ'}
          />
        </PaginationItem>

        {/* 固定データの順序を変えず、各値を PaginationItem の直下へ配置する。 */}
        {entries.map((entry) => (
          <PaginationItem key={entry.id}>
            {entry.kind === 'ellipsis' ? (
              // 省略位置は専用 subcomponent を使い、支援技術向け非表示契約を維持する。
              <PaginationEllipsis data-testid={`pagination-${entry.id}`} />
            ) : (
              // 各ページは実アンカーとして公開し、現在ページだけを aria-current で識別する。
              <PaginationLink
                aria-label={`${String(entry.page)}ページ`}
                href={getPaginationHref(entry.page)}
                isActive={entry.page === currentPage}
                onClick={paginationLinkClick}
                role="link"
              >
                {entry.page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            aria-disabled={nextDisabled ? true : undefined}
            aria-label="次のページへ"
            className={nextDisabled ? disabledLinkClassName : undefined}
            href={getPaginationHref(nextPage ?? currentPage)}
            onClick={nextDisabled ? preventDisabledPaginationNavigation : paginationLinkClick}
            role="link"
            size={compact ? 'icon' : 'default'}
            tabIndex={nextDisabled ? -1 : undefined}
            text={compact ? '' : '次へ'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/**
 * Pagination の公開 subcomponent と固定状態を定義する CSF3 metadata。
 *
 * Controls は無効化し、ページ番号、active、ellipsis、境界状態、モバイル配置を
 * 各 Story で常に同じ条件で再現する。
 */
const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  subcomponents: {
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '固定ページで全 subcomponent、前後移動、現在ページ、省略表示、境界の操作不可 semantics、狭幅配置を確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Pagination>;

/** Storybook が Pagination catalog を構築するための既定 metadata。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 全 subcomponent、Previous、Next、active page、ellipsis を含む標準 Pagination。 */
export const AllSubcomponents: Story = {
  render: () => (
    <PaginationCatalog
      ariaLabel="ページ移動"
      currentPage={3}
      entries={allSubcomponentEntries}
      nextPage={4}
      previousPage={2}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を消去し、この Story で発生した click だけを検証する。
    paginationLinkClick.mockClear();

    // Story canvas 内の nav に検索範囲を限定し、Storybook 自体の navigation を除外する。
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('navigation', { name: 'ページ移動' });
    const navigationContent = within(navigation);

    await step('nav、list、現在ページ、省略表示の semantics を公開する', async () => {
      // root が固有のアクセシブル名を持つ nav として公開されることを確認する。
      await expect(navigation.tagName).toBe('NAV');
      await expect(navigation).toHaveAccessibleName('ページ移動');

      // PaginationContent が固定ページ順を表す unordered list であることを確認する。
      await expect(navigationContent.getByRole('list').tagName).toBe('UL');

      // active page は見た目だけでなく aria-current によって現在ページを伝える。
      await expect(navigationContent.getByRole('link', { name: '3ページ' })).toHaveAttribute(
        'aria-current',
        'page'
      );

      // Ellipsis は視覚表示だけに限定し、読み上げ順へ重複情報を追加しない。
      await expect(canvas.getByTestId('pagination-ellipsis-after-4')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    await step('ページ click を一度だけ通知し、Story の URL は変更しない', async () => {
      // 遷移抑止前の URL を保存し、実利用と同じ userEvent click の後で同一性を比較する。
      const locationBeforeClick = canvasElement.ownerDocument.location.href;
      await userEvent.click(navigationContent.getByRole('link', { name: '4ページ' }));

      await expect(paginationLinkClick).toHaveBeenCalledTimes(1);
      await expect(canvasElement.ownerDocument.location.href).toBe(locationBeforeClick);
    });
  },
};

/** 先頭ページを active にし、Previous の操作不可 semantics を示す Pagination。 */
export const FirstPage: Story = {
  render: () => (
    <PaginationCatalog
      ariaLabel="先頭ページのページ移動"
      currentPage={1}
      entries={firstPageEntries}
      nextPage={2}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // 固有の nav 名から先頭ページ例だけを取得し、他 Story と独立して検証する。
    const navigation = within(canvasElement).getByRole('navigation', {
      name: '先頭ページのページ移動',
    });
    const navigationContent = within(navigation);
    const previous = navigationContent.getByRole('link', { name: '前のページへ' });

    await step('Previous を読み上げ上もフォーカス順でも操作不可にする', async () => {
      // anchor semantics を保ちながら、境界状態を aria-disabled と tabIndex で明示する。
      await expect(previous).toHaveAttribute('aria-disabled', 'true');
      await expect(previous).toHaveAttribute('tabindex', '-1');
      await expect(navigationContent.getByRole('link', { name: '1ページ' })).toHaveAttribute(
        'aria-current',
        'page'
      );

      // 次ページが存在するため、Next へ誤って操作不可状態を伝えない。
      await expect(
        navigationContent.getByRole('link', { name: '次のページへ' })
      ).not.toHaveAttribute('aria-disabled');
    });
  },
};

/** 末尾ページを active にし、Next の操作不可 semantics を示す Pagination。 */
export const LastPage: Story = {
  render: () => (
    <PaginationCatalog
      ariaLabel="末尾ページのページ移動"
      currentPage={10}
      entries={lastPageEntries}
      previousPage={9}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // 固有の nav 名から末尾ページ例だけを取得し、他 Story と独立して検証する。
    const navigation = within(canvasElement).getByRole('navigation', {
      name: '末尾ページのページ移動',
    });
    const navigationContent = within(navigation);
    const next = navigationContent.getByRole('link', { name: '次のページへ' });

    await step('Next を読み上げ上もフォーカス順でも操作不可にする', async () => {
      // anchor semantics を保ちながら、境界状態を aria-disabled と tabIndex で明示する。
      await expect(next).toHaveAttribute('aria-disabled', 'true');
      await expect(next).toHaveAttribute('tabindex', '-1');
      await expect(navigationContent.getByRole('link', { name: '10ページ' })).toHaveAttribute(
        'aria-current',
        'page'
      );

      // 前ページが存在するため、Previous へ誤って操作不可状態を伝えない。
      await expect(
        navigationContent.getByRole('link', { name: '前のページへ' })
      ).not.toHaveAttribute('aria-disabled');
    });
  },
};

/** 前後操作を icon-only にし、現在ページと均等配置するモバイル向け Pagination。 */
export const MobileCompact: Story = {
  render: () => (
    // 12rem の固定 frame で狭幅を再現し、canvas がさらに狭い場合は利用可能幅へ追従する。
    <div className="w-48 max-w-full" data-testid="mobile-pagination-frame">
      <PaginationCatalog
        ariaLabel="モバイルのページ移動"
        compact
        currentPage={5}
        entries={mobileCompactEntries}
        nextPage={6}
        previousPage={4}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 狭幅 frame、nav、前後操作をアクセシブル名で取得し、表示文字の有無へ依存しない。
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId('mobile-pagination-frame');
    const navigation = canvas.getByRole('navigation', { name: 'モバイルのページ移動' });
    const navigationContent = within(navigation);

    await step('icon-only の前後操作と現在ページを狭幅内へ収める', async () => {
      // 可視文字を省略しても、前後操作は aria-label により名前付き link として利用できる。
      await expect(navigationContent.getByRole('link', { name: '前のページへ' })).toBeVisible();
      await expect(navigationContent.getByRole('link', { name: '次のページへ' })).toBeVisible();
      await expect(navigationContent.getByRole('link', { name: '5ページ' })).toHaveAttribute(
        'aria-current',
        'page'
      );

      // Pagination 全体の scrollWidth が frame を超えず、水平 overflow を発生させない。
      await expect(navigation.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    });
  },
};
