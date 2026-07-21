import { expect, within } from 'storybook/test';

import { DataTable } from '@cfreact-template/ui/components/data-table';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';

/** 固定行が保持する識別子、表示名、状態、担当、更新日、説明の型。 */
interface CatalogRow {
  /** `getRowId` が TanStack Table の行 ID へ変換する一意な固定識別子。 */
  readonly recordId: string;
  /** 標準セルへ表示し、各固定行を識別する製品非依存の名前。 */
  readonly name: string;
  /** 表の状態列へ表示する、決定的な固定状態。 */
  readonly status: '有効' | '確認中' | '停止';
  /** 表の担当列へ表示する、製品文脈に依存しない固定値。 */
  readonly owner: string;
  /** 表の更新日列へそのまま表示する、実行時時刻に依存しない固定値。 */
  readonly updatedAt: string;
  /** 狭幅で横スクロールを検証するための長い固定文。 */
  readonly description: string;
}

/** 全 Story が同じ順序と値で使用する、型付きの固定行データ。 */
const catalogRows: CatalogRow[] = [
  {
    recordId: 'entry-alpha',
    name: '項目 A',
    status: '有効',
    owner: '担当 A',
    updatedAt: '2026-07-01',
    description: '表の基本表示とセル内容を確認するための固定された説明文です。',
  },
  {
    recordId: 'entry-bravo',
    name: '項目 B',
    status: '確認中',
    owner: '担当 B',
    updatedAt: '2026-07-08',
    description: '狭い表示領域でも内容を省略せず横方向へ確認できる長い固定説明文です。',
  },
  {
    recordId: 'entry-charlie',
    name: '項目 C',
    status: '停止',
    owner: '担当 C',
    updatedAt: '2026-07-15',
    description: '外部通信や現在日時を使用せず再現可能な状態を保つための固定説明文です。',
  },
];

/** 通常表示、空状態、caption で共有する、型付きの基本列定義。 */
const standardColumns: ColumnDef<CatalogRow>[] = [
  {
    accessorKey: 'name',
    header: '項目名',
  },
  {
    accessorKey: 'status',
    header: '状態',
  },
  {
    accessorKey: 'owner',
    header: '担当',
  },
  {
    accessorKey: 'updatedAt',
    header: '更新日',
  },
];

/** `getRowId` の結果をセルへ可視化し、既定の index ID と区別する型付き列定義。 */
const rowIdentifierColumns: ColumnDef<CatalogRow>[] = [
  {
    id: 'rowId',
    header: '行 ID',
    cell: ({ row }) => row.id,
  },
  {
    accessorKey: 'name',
    header: '項目名',
  },
];

/** 長文と複数列の幅を維持し、狭幅での横スクロールを再現する型付き列定義。 */
const longContentColumns: ColumnDef<CatalogRow>[] = [
  {
    accessorKey: 'recordId',
    header: '固定識別子',
  },
  {
    accessorKey: 'name',
    header: '項目名',
  },
  {
    accessorKey: 'description',
    header: '説明',
  },
  {
    accessorKey: 'updatedAt',
    header: '更新日',
  },
];

/** 空配列でも列の型を維持し、実行ごとに異なる参照内容を生成しない固定値。 */
const emptyRows: CatalogRow[] = [];

/** `DataTable` が表示する日本語の空状態メッセージ。 */
const emptyMessage = '表示する項目がありません。';

/** `caption` の可視表示と table のアクセシブルネームで共有する固定文言。 */
const tableCaption = '固定項目の一覧';

/** Storybook が具体的な行型を保持できるよう、generic な `DataTable` の型引数だけを固定した参照。 */
const CatalogDataTable = DataTable<CatalogRow, unknown>;

/**
 * `DataTable` を CSF 3 の Docs、Controls、light/dark browser tests へ直接登録する。
 * 製品文脈を仮定せず、公開 props、型付き固定データ、既存 token だけを catalog 化する。
 */
const meta = {
  title: 'Components/Data Table',
  component: CatalogDataTable,
  args: {
    columns: standardColumns,
    data: catalogRows,
    emptyMessage,
  },
  argTypes: {
    caption: {
      control: 'text',
      description: '表の目的を可視表示し、table のアクセシブルネームとして提供する caption。',
    },
    columns: {
      control: false,
      description: '見出し、セル、行操作を定義する TanStack Table の型付き ColumnDef 配列。',
    },
    data: {
      control: false,
      description: '列定義と同じ行型を持ち、入力順のまま表示する固定データ。',
    },
    emptyMessage: {
      control: 'text',
      description: '行が存在しない場合に全列へまたがって表示するメッセージ。',
    },
    getRowId: {
      control: false,
      description: '元データから安定した TanStack Table の行 ID を導出する関数。',
    },
  },
  parameters: {
    layout: 'padded',
    controls: {
      include: ['caption', 'emptyMessage'],
    },
    docs: {
      description: {
        component:
          '型付き ColumnDef と固定行データを共通 Table primitives で描画する DataTable。通常表示、空状態、caption、カスタム行 ID、長文の横スクロールを公開契約の範囲で確認できます。',
      },
    },
  },
  render: (args) => <CatalogDataTable {...args} />,
} satisfies Meta<typeof CatalogDataTable>;

/** Storybook が DataTable catalog の型、Docs、Controls、browser tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 固定行を基本列で描画し、見出し、行数、代表セルが正しい表構造を持つことを検証する。 */
export const Populated: Story = {
  play: async ({ canvasElement, step }) => {
    // Story canvas 内の table だけを role で取得し、Storybook UI の同名要素を検索対象から除外する。
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table');
    const tableCanvas = within(table);

    await step('型付き ColumnDef の見出しを順序どおり表示する', async () => {
      // 公開列定義の四見出しを role と可視文言の双方で確認する。
      const headers = tableCanvas.getAllByRole('columnheader');

      await expect(headers).toHaveLength(standardColumns.length);
      await expect(headers.map((header) => header.textContent)).toEqual([
        '項目名',
        '状態',
        '担当',
        '更新日',
      ]);
    });

    await step('固定行の件数と代表セルを table semantics 内で表示する', async () => {
      // header row を含む行数と、二行目の値の組み合わせから入力順とセル対応を保証する。
      const rows = tableCanvas.getAllByRole('row');
      const secondDataRow = tableCanvas.getByRole('cell', { name: '項目 B' }).closest('tr');

      if (!(secondDataRow instanceof HTMLTableRowElement)) {
        throw new TypeError('代表セルを含む table row が見つかりません。');
      }

      await expect(rows).toHaveLength(catalogRows.length + 1);
      await expect(within(secondDataRow).getByRole('cell', { name: '項目 B' })).toBeVisible();
      await expect(within(secondDataRow).getByRole('cell', { name: '確認中' })).toBeVisible();
      await expect(within(secondDataRow).getByRole('cell', { name: '2026-07-08' })).toBeVisible();
    });
  },
};

/** 行がない場合に日本語メッセージを全列へまたがって表示し、見出しを保持することを検証する。 */
export const Empty: Story = {
  args: {
    data: emptyRows,
  },
  play: async ({ canvasElement, step }) => {
    // 空状態でも残る table と、その内部の見出し・本文行を semantic role から取得する。
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table');
    const tableCanvas = within(table);
    const messageCell = tableCanvas.getByRole('cell', { name: emptyMessage });

    await step('列見出しを残したまま空状態を一行で表示する', async () => {
      // header row と空状態 row の二行だけが存在し、利用者が列構造を失わないことを確認する。
      await expect(tableCanvas.getAllByRole('columnheader')).toHaveLength(standardColumns.length);
      await expect(tableCanvas.getAllByRole('row')).toHaveLength(2);
      await expect(messageCell).toBeVisible();
    });

    await step('空状態セルを全列へまたがらせる', async () => {
      // DataTable が列数から導出した colSpan を属性値で確認し、途中列だけの空状態にならないことを保証する。
      await expect(messageCell).toHaveAttribute('colspan', String(standardColumns.length));
    });
  },
};

/** `getRowId` で固定識別子を行 ID に採用し、ColumnDef のセル文脈から取得できることを検証する。 */
export const CustomRowIds: Story = {
  args: {
    columns: rowIdentifierColumns,
    getRowId: (row) => row.recordId,
  },
  play: async ({ canvasElement, step }) => {
    // 可視化した行 ID 列を table 内だけで検索し、既定 index とカスタム ID の違いを観測する。
    const table = within(canvasElement).getByRole('table');
    const tableCanvas = within(table);

    await step('全行で元データの固定識別子を TanStack Table の行 ID として使用する', async () => {
      // 先頭と末尾の固定 ID を確認し、index に依存しない導出が全データ範囲で有効であることを保証する。
      await expect(tableCanvas.getByRole('cell', { name: 'entry-alpha' })).toBeVisible();
      await expect(tableCanvas.getByRole('cell', { name: 'entry-charlie' })).toBeVisible();
      await expect(tableCanvas.queryByRole('cell', { name: '0' })).not.toBeInTheDocument();
    });
  },
};

/** caption を可視表示し、同じ文言が table のアクセシブルネームになることを検証する。 */
export const Caption: Story = {
  args: {
    caption: tableCaption,
  },
  play: async ({ canvasElement, step }) => {
    // caption 由来の名前で table を取得し、可視文言と支援技術向け名称を同じ根拠から検証する。
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: tableCaption });

    await step('caption を表示して table の目的を支援技術へ伝える', async () => {
      // caption 要素の表示と table の accessible name を分けて確認し、視覚・非視覚双方の契約を保証する。
      await expect(canvas.getByText(tableCaption, { selector: 'caption' })).toBeVisible();
      await expect(table).toHaveAccessibleName(tableCaption);
    });
  },
};

/** 長いセル内容を狭幅で欠落させず、Table の横スクロール領域から確認できることを検証する。 */
export const LongContentResponsiveOverflow: Story = {
  args: {
    columns: longContentColumns,
  },
  render: (args) => (
    // 18rem の狭幅を固定し、DataTable 内の Table が content を折り潰さず横スクロールへ移す条件を作る。
    <div className="w-72 max-w-full" data-testid="narrow-data-table-frame">
      <DataTable<CatalogRow, unknown>
        {...args}
        aria-label="長い内容を含む表の横スクロール領域"
        className="[&_[data-slot=table-container]]:w-max [&_[data-slot=table-container]]:overflow-visible [&_[data-slot=table]]:min-w-3xl"
        role="region"
        tabIndex={0}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 狭幅 frame、table、DataTable が公開する外側の overflow region を同じ Story canvas から取得する。
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId('narrow-data-table-frame');
    const table = canvas.getByRole('table');
    const scrollRegion = canvas.getByRole('region', {
      name: '長い内容を含む表の横スクロール領域',
    });

    await step('長い固定内容と全列を table semantics のまま保持する', async () => {
      // 長文セルと列数を確認し、狭幅対応のために情報を削除していないことを保証する。
      await expect(
        within(table).getByRole('cell', {
          name: '狭い表示領域でも内容を省略せず横方向へ確認できる長い固定説明文です。',
        })
      ).toBeVisible();
      await expect(within(table).getAllByRole('columnheader')).toHaveLength(
        longContentColumns.length
      );
    });

    await step('狭幅の外側へ table を漏らさず横スクロール領域を提供する', async () => {
      // region の実測幅と scrollWidth を比較し、親幅へ収まりながらキーボードで全内容へ到達できることを確認する。
      await expect(scrollRegion).toHaveAttribute('tabindex', '0');
      await expect(scrollRegion.clientWidth).toBeLessThanOrEqual(frame.clientWidth);
      await expect(scrollRegion.scrollWidth).toBeGreaterThan(scrollRegion.clientWidth);
      await expect(table.getBoundingClientRect().width).toBeGreaterThan(frame.clientWidth);
    });
  },
};
