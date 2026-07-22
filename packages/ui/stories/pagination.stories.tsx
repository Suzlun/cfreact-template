import { expect, userEvent, within } from 'storybook/test';

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

/**
 * shadcn/ui 公式 Pagination の構成と公開アクセシビリティ契約を示す CSF3 metadata。
 *
 * 公式 Basic example の可視構造だけを扱い、アプリケーション固有のページ状態や
 * responsive window、境界ページの disabled 擬似契約は追加しない。
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
          'shadcn/ui 公式 Pagination の Basic example と同じく、Previous、1、current の 2、3、ellipsis、Next を表示します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Pagination>;

/** Storybook が Pagination の公式カタログ表示を構築するための既定 metadata。 */
export default meta;

/** metadata から公式 Pagination Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式 Basic example と同じ Previous、ページ番号、ellipsis、Next を描画する。
 *
 * interaction test は内部 DOM や寸法ではなく、利用者が依存する navigation、
 * link、current page、keyboard focus の公開契約だけを確認する。
 */
export const Default: Story = {
  render: () => (
    // 公式 example の静的構成を保ち、Story 専用の状態遷移や表示分岐を持ち込まない。
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement, step }) => {
    // Story canvas 内へ検索を限定し、Storybook 自体の navigation と link を検証対象から除く。
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('navigation', { name: 'pagination' });
    const navigationContent = within(navigation);

    await step('navigation、link、current page の公開契約を確認する', async () => {
      // 前後移動とページ番号が、button ではなくページ遷移用 link として利用できることを確認する。
      await expect(
        navigationContent.getByRole('link', { name: 'Go to previous page' })
      ).toBeVisible();
      await expect(navigationContent.getByRole('link', { name: '1' })).toBeVisible();
      await expect(navigationContent.getByRole('link', { name: '3' })).toBeVisible();
      await expect(navigationContent.getByRole('link', { name: 'Go to next page' })).toBeVisible();

      // 公式 example の2ページ目だけが現在位置を支援技術へ伝えることを確認する。
      await expect(navigationContent.getByRole('link', { name: '2' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });

    await step('Tab で最初のページ移動 link へフォーカスできる', async () => {
      // browser 標準の Tab 順を使い、公式構成の先頭操作である Previous へ到達する。
      await userEvent.tab();
      await expect(
        navigationContent.getByRole('link', { name: 'Go to previous page' })
      ).toHaveFocus();
    });
  },
};
