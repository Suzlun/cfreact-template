import { expect, within } from 'storybook/test';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@cfreact-template/ui/components/table';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** shadcn/ui 公式 Table example が掲載する invoice 一覧の可視 caption。 */
const invoiceTableCaption = 'A list of your recent invoices.';

/** 公式 registry example が表示する請求書を、同じ値と順序で保持する。 */
const invoices = [
  {
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV002',
    paymentStatus: 'Pending',
    totalAmount: '$150.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV003',
    paymentStatus: 'Unpaid',
    totalAmount: '$350.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV004',
    paymentStatus: 'Paid',
    totalAmount: '$450.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV005',
    paymentStatus: 'Paid',
    totalAmount: '$550.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV006',
    paymentStatus: 'Pending',
    totalAmount: '$200.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV007',
    paymentStatus: 'Unpaid',
    totalAmount: '$300.00',
    paymentMethod: 'Credit Card',
  },
] as const;

/** 公式 registry example と同じ footer 集計額。 */
const invoiceTotal = '$2,500.00';

/** 公式 example の四列と、header・body・footer の意味構造を持つ invoice table を描画する。 */
function InvoiceTable() {
  return (
    <div className="w-full max-w-2xl">
      <Table className="min-w-xl" tabIndex={0}>
        {/* 可視 caption を table の accessible name としても使用する。 */}
        <TableCaption>{invoiceTableCaption}</TableCaption>

        {/* 明示した column scope により、四つの見出しと各データセルの対応を支援技術へ伝える。 */}
        <TableHeader>
          <TableRow>
            <TableHead className="w-24" scope="col">
              Invoice
            </TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Method</TableHead>
            <TableHead className="text-right tabular-nums" scope="col">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* 公式の固定 invoice を入力順に描画し、状態・支払方法・金額を一行で比較できるようにする。 */}
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.invoice}>
              <TableCell className="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell className="text-right tabular-nums">{invoice.totalAmount}</TableCell>
            </TableRow>
          ))}
        </TableBody>

        {/* footer は公式 example と同じ列結合を使い、一覧全体の合計を金額列へ揃える。 */}
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right tabular-nums">{invoiceTotal}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

/**
 * Table primitives を公式 invoice example の実用途として登録する CSF metadata。
 *
 * controls 用の props matrix は設けず、既存 theme global による Light/Dark と、
 * 390px browser project による横スクロールを同じ構成で検証する。
 */
const meta = {
  title: 'Components/Table',
  component: Table,
  subcomponents: {
    TableCaption,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Table example に忠実な invoice 一覧です。caption、header、body、footer の native table semantics、Light/Dark token、狭幅での横スクロールを一つの実用構成で確認できます。',
      },
    },
  },
} satisfies Meta<typeof Table>;

/** Storybook が Table の CSF metadata と全 subcomponent の関連を読み取るための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式 invoice table の完全な情報構造と、390px 幅での keyboard 到達可能な横スクロールを示す Story。
 */
export const RecentInvoices: Story = {
  render: () => <InvoiceTable />,
  play: async ({ canvasElement, step }) => {
    // Storybook の管理 UI を除外し、caption から取得した table の native semantics だけを検証する。
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: invoiceTableCaption });
    const tableCanvas = within(table);
    const scrollContainer = table.parentElement;

    // Table component が生成する横スクロール要素を型で確認し、DOM 前提が崩れた場合は明示的に失敗させる。
    if (!(scrollContainer instanceof HTMLDivElement)) {
      throw new TypeError('Table の横スクロール container が見つかりません。');
    }

    await step('caption、header、body、footer を native table semantics で構成する', async () => {
      // caption は可視コピーと accessible name を兼ね、三つの rowgroup と四列の対応を保持する。
      await expect(canvas.getByText(invoiceTableCaption, { selector: 'caption' })).toBeVisible();
      await expect(table).toHaveAccessibleName(invoiceTableCaption);
      await expect(tableCanvas.getAllByRole('rowgroup')).toHaveLength(3);
      await expect(tableCanvas.getAllByRole('columnheader')).toHaveLength(4);
      await expect(tableCanvas.getAllByRole('row')).toHaveLength(invoices.length + 2);

      // 全見出しの scope を明示し、見た目だけの header へ退行させない。
      for (const columnHeader of tableCanvas.getAllByRole('columnheader')) {
        await expect(columnHeader).toHaveAttribute('scope', 'col');
      }
    });

    await step('公式 invoice と footer 合計を読みやすい金額列で表示する', async () => {
      // 公式例の先頭・末尾 invoice と集計額を確認し、固定データの欠落や順序変更を検出する。
      await expect(tableCanvas.getByRole('cell', { name: 'INV001' })).toBeVisible();
      await expect(tableCanvas.getByRole('cell', { name: 'INV007' })).toBeVisible();
      await expect(tableCanvas.getByRole('cell', { name: invoiceTotal })).toHaveClass(
        'text-right',
        'tabular-nums'
      );
      await expect(tableCanvas.getByText('Total', { selector: 'td' })).toBeVisible();
    });

    await step('390px viewport では全列を保持したまま横スクロールを提供する', async () => {
      // mobile browser project だけで実測し、desktop では不要な overflow を要求しない。
      const viewportWidth = canvasElement.ownerDocument.defaultView?.innerWidth;

      if (viewportWidth === 390) {
        await expect(table).toHaveAttribute('tabindex', '0');
        await expect(scrollContainer.scrollWidth).toBeGreaterThan(scrollContainer.clientWidth);
      }
    });
  },
};
