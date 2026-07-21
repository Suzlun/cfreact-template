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

/** 固定表で一貫して表示する列数。空状態の `colSpan` と意味的な列構造を同期する。 */
const columnCount = 7;

/** 通常表示と各状態 Story が共有する、製品文脈に依存しない固定表題。 */
const defaultCaption = '固定項目の一覧';

/** 行が存在しない場合に、表の列構造を残したまま本文へ表示する固定文言。 */
const emptyMessage = '表示する項目がありません。';

/** 横スクロール Story で折り返されないセルの到達性を確認する、空白を含まない固定値。 */
const longReference =
  'REF-CHARLIE-20260721-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** 数値セルの表示を実行環境に左右されない日本語表記へ揃える formatter。 */
const numberFormatter = new Intl.NumberFormat('ja-JP');

/**
 * Table の Story 群が描画する固定行の型。
 *
 * 各プロパティは汎用的な表形式データだけを表し、sorting、pagination、外部通信などの
 * 製品固有動作を持たない。すべての値は Story の再実行時にも変化しない。
 */
interface GenericTableRow {
  /** `key` と先頭の行見出しへ使用する、一意で安定した固定識別子。 */
  readonly id: string;
  /** 行の代表内容として標準セルへ表示する汎用的な項目名。 */
  readonly name: string;
  /** 表の状態列へ文字列として表示する、操作を伴わない固定状態。 */
  readonly status: '有効' | '確認中' | '停止';
  /** 担当列へ表示する、製品や実在人物へ依存しない固定ラベル。 */
  readonly owner: string;
  /** 数量列で右揃えと等幅数字を確認する固定整数。 */
  readonly quantity: number;
  /** 数値列で桁区切り、右揃え、footer 集計を確認する固定整数。 */
  readonly value: number;
  /** 通常値と空白を含まない長い値の双方を確認する固定参照文字列。 */
  readonly reference: string;
}

/** すべての非空 Story が入力順を変えずに使用する、型付きの固定表データ。 */
const genericRows: readonly GenericTableRow[] = [
  {
    id: 'entry-alpha',
    name: '項目 A',
    status: '有効',
    owner: '担当 A',
    quantity: 12,
    value: 1200,
    reference: 'REF-ALPHA-20260701',
  },
  {
    id: 'entry-bravo',
    name: '項目 B',
    status: '確認中',
    owner: '担当 B',
    quantity: 7,
    value: 2400,
    reference: 'REF-BRAVO-20260708',
  },
  {
    id: 'entry-charlie',
    name: '項目 C',
    status: '停止',
    owner: '担当 C',
    quantity: 3,
    value: 3600,
    reference: longReference,
  },
];

/** 外部状態を生成せず、空の `TableBody` 表示だけを再現する固定配列。 */
const emptyRows: readonly GenericTableRow[] = [];

/** Story 専用の共通表へ渡す固定データ、caption、表示密度、幅の入力。 */
interface TablePreviewProps {
  /** `TableCaption` へ表示し、table の accessible name を提供する文言。 */
  readonly caption: string;
  /** `TableBody` へ入力順のまま描画し、footer 集計にも使用する固定行。 */
  readonly rows: readonly GenericTableRow[];
  /** 公開 `className` 契約だけで既定密度と compact 表示を切り替える指定。 */
  readonly compact?: boolean;
  /** Table 本体の公開 `className` へ渡し、文字密度または最小幅を指定する既存 utility。 */
  readonly tableClassName?: string;
  /** 横スクロール時に Table 本体をキーボード到達可能にする native `tabIndex`。 */
  readonly tableTabIndex?: number;
}

/**
 * Table の全公開 subcomponent を native table semantics の順序で構成する。
 *
 * @param props - 固定 caption、固定行、compact 指定、Table 本体の既存 className と tabIndex。
 * @returns caption、header、body、footer を持つ、操作機能のない固定 Table。
 * @remarks 入力行から表示用合計を同期的に算出するだけで、外部通信や状態変更は発生しない。
 * @example
 * ```tsx
 * <TablePreview caption="固定項目の一覧" rows={genericRows} />
 * ```
 */
function TablePreview({
  caption,
  rows,
  compact = false,
  tableClassName,
  tableTabIndex,
}: TablePreviewProps) {
  // compact 時だけ既存 spacing scale を小さくし、公開 className 以外の密度 API を仮定しない。
  const headClassName = compact ? 'h-8 py-1' : undefined;
  const cellClassName = compact ? 'py-1' : undefined;
  const rowHeaderClassName = compact ? 'h-8 py-1 font-mono text-xs' : 'font-mono text-xs';
  const numericHeadClassName = compact
    ? 'h-8 py-1 text-right tabular-nums'
    : 'text-right tabular-nums';
  const numericCellClassName = compact ? 'py-1 text-right tabular-nums' : 'text-right tabular-nums';
  const referenceCellClassName = compact ? 'py-1 font-mono text-xs' : 'font-mono text-xs';

  // footer を入力行と常に一致させ、固定 Story 内に重複した合計値を保持しない。
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <Table className={tableClassName} tabIndex={tableTabIndex}>
      {/* native caption を table の直下へ置き、可視表題と accessible name を同じ文言から提供する。 */}
      <TableCaption>{caption}</TableCaption>

      {/* thead と scope="col" を組み合わせ、全七列を支援技術が列見出しとして解釈できるようにする。 */}
      <TableHeader>
        <TableRow>
          <TableHead className={headClassName} scope="col">
            識別子
          </TableHead>
          <TableHead className={headClassName} scope="col">
            項目名
          </TableHead>
          <TableHead className={headClassName} scope="col">
            状態
          </TableHead>
          <TableHead className={headClassName} scope="col">
            担当
          </TableHead>
          <TableHead className={numericHeadClassName} scope="col">
            数量
          </TableHead>
          <TableHead className={numericHeadClassName} scope="col">
            数値
          </TableHead>
          <TableHead className={headClassName} scope="col">
            固定参照
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.length === 0 ? (
          // 空状態も tbody 内の一行として表現し、列見出しと footer の意味構造を維持する。
          <TableRow>
            <TableCell className="h-24 text-center text-muted-foreground" colSpan={columnCount}>
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          // 固定行を入力順のまま描画し、先頭 th の scope="row" で各行の意味的な見出しを提供する。
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableHead className={rowHeaderClassName} scope="row">
                {row.id}
              </TableHead>
              <TableCell className={cellClassName}>{row.name}</TableCell>
              <TableCell className={cellClassName}>{row.status}</TableCell>
              <TableCell className={cellClassName}>{row.owner}</TableCell>
              <TableCell className={numericCellClassName}>
                {numberFormatter.format(row.quantity)}
              </TableCell>
              <TableCell className={numericCellClassName}>
                {numberFormatter.format(row.value)}
              </TableCell>
              <TableCell className={referenceCellClassName}>{row.reference}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>

      {/* tfoot は本文の後へ置き、七列の位置を保ったまま数量、数値、表示行数を要約する。 */}
      <TableFooter>
        <TableRow>
          <TableCell className={cellClassName} colSpan={4}>
            合計
          </TableCell>
          <TableCell className={numericCellClassName}>
            {numberFormatter.format(totalQuantity)}
          </TableCell>
          <TableCell className={numericCellClassName}>
            {numberFormatter.format(totalValue)}
          </TableCell>
          <TableCell className={cellClassName}>{rows.length} 行</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

/**
 * Table と全公開 subcomponent を CSF 3 の Docs、a11y、browser tests へ直接登録する。
 * 固定の汎用データ、native table semantics、既存 token と公開 className 契約だけを使用する。
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
    layout: 'padded',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'native table semantics を保つ Table primitives。caption、header、body、footer、列・行見出し、数値配置、compact 密度、長い非改行セルの横スクロール、空状態を固定例で確認できます。sorting や pagination の動作は追加しません。',
      },
    },
  },
} satisfies Meta<typeof Table>;

/**
 * Storybook が Table catalog の型、Docs、アクセシビリティ検査、browser tests を構築する既定 export。
 * この metadata は表示専用であり、実行時状態や外部作用を生成しない。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * caption、header、body、footer と全セル種別を固定三行で表示する基本 Story。
 *
 * @remarks caption の可視性と accessible name、rowgroup、列見出し、行見出し、数値配置を検証する。
 * @example Storybook の `Components/Table/Complete` を開いて意味構造と全 subcomponent を確認する。
 */
export const Complete: Story = {
  render: () => <TablePreview caption={defaultCaption} rows={genericRows} />,
  play: async ({ canvasElement, step }) => {
    // canvas 内に検索を限定し、Storybook 自体の DOM を table assertion の対象から除外する。
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: defaultCaption });
    const tableCanvas = within(table);

    await step('caption を可視表示し、table の accessible name として提供する', async () => {
      // native caption と accessible name を別々に確認し、視覚・非視覚の双方で表題を保証する。
      await expect(canvas.getByText(defaultCaption, { selector: 'caption' })).toBeVisible();
      await expect(table).toHaveAccessibleName(defaultCaption);
    });

    await step(
      'header、body、footer と列・行見出しを native table semantics で構成する',
      async () => {
        // 三つの rowgroup、七つの列見出し、三つの行見出しから各 section の意味構造を確認する。
        const columnHeaders = tableCanvas.getAllByRole('columnheader');

        await expect(tableCanvas.getAllByRole('rowgroup')).toHaveLength(3);
        await expect(columnHeaders).toHaveLength(columnCount);
        await expect(tableCanvas.getAllByRole('rowheader')).toHaveLength(genericRows.length);
        await expect(tableCanvas.getAllByRole('row')).toHaveLength(genericRows.length + 2);

        // 全列見出しが明示的な scope を持つことを確認し、見た目だけの header へ退行させない。
        for (const columnHeader of columnHeaders) {
          await expect(columnHeader).toHaveAttribute('scope', 'col');
        }
      }
    );

    await step('数値列を右揃えかつ等幅数字で表示する', async () => {
      // 見出しと代表セルへ同じ配置 utility を適用し、列全体の桁位置を一貫させる。
      await expect(tableCanvas.getByRole('columnheader', { name: '数量' })).toHaveClass(
        'text-right',
        'tabular-nums'
      );
      await expect(tableCanvas.getByRole('cell', { name: '1,200' })).toHaveClass(
        'text-right',
        'tabular-nums'
      );
    });
  },
};

/**
 * 既存 spacing と typography utility だけで Table の縦方向密度を抑えた Story。
 *
 * @remarks 専用 size prop を創作せず、各 primitive が公開する `className` 契約で compact 表示を構成する。
 * @example Storybook の `Components/Table/Compact` を開き、同じ列構造の密度差を確認する。
 */
export const Compact: Story = {
  render: () => (
    <TablePreview
      caption="コンパクトな固定項目一覧"
      rows={genericRows}
      compact
      tableClassName="text-xs"
    />
  ),
  play: async ({ canvasElement, step }) => {
    // caption 由来の名前で compact table を取得し、見た目の密度変更後も意味構造を維持する。
    const table = within(canvasElement).getByRole('table', { name: 'コンパクトな固定項目一覧' });
    const tableCanvas = within(table);

    await step('compact spacing でも全列と固定行を保持する', async () => {
      // 縦余白だけを縮小した代表セルと列数を確認し、情報削除による compact 化を防ぐ。
      await expect(tableCanvas.getAllByRole('columnheader')).toHaveLength(columnCount);
      await expect(tableCanvas.getByRole('columnheader', { name: '数量' })).toHaveClass('h-8');
      await expect(tableCanvas.getByRole('cell', { name: '項目 B' })).toHaveClass('py-1');
      await expect(table).toHaveClass('text-xs');
    });
  },
};

/**
 * 狭い frame 内で幅広い Table と空白を含まない長いセルを保持する overflow Story。
 *
 * @remarks Table の既存 wrapper と公開 `className` だけを使用し、列の省略や独自操作を追加しない。
 * @example Storybook の `Components/Table/WideHorizontalOverflow` を狭い viewport で開いて横方向を確認する。
 */
export const WideHorizontalOverflow: Story = {
  render: () => (
    // 外側の固定幅は overflow 条件だけを作り、Table 自身の wrapper と意味構造には手を加えない。
    <div className="w-72 max-w-full" data-testid="narrow-table-frame">
      <TablePreview
        caption="幅広い固定項目一覧"
        rows={genericRows}
        tableClassName="min-w-5xl"
        tableTabIndex={0}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // frame、caption 付き table、Table が公開実装で生成する直近 wrapper を同じ canvas から取得する。
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId('narrow-table-frame');
    const table = canvas.getByRole('table', { name: '幅広い固定項目一覧' });
    const scrollContainer = table.parentElement;

    if (!(scrollContainer instanceof HTMLDivElement)) {
      throw new TypeError('Table の横スクロール container が見つかりません。');
    }

    await step('長い非改行値と全列を table 内に保持する', async () => {
      // 最長の固定参照を完全一致で取得し、省略・分割・別 UI への置換がないことを確認する。
      const longCell = within(table).getByRole('cell', { name: longReference });

      await expect(longCell).toBeVisible();
      await expect(longCell).toHaveClass('whitespace-nowrap');
      await expect(within(table).getAllByRole('columnheader')).toHaveLength(columnCount);
    });

    await step('狭い frame から内容を漏らさず横スクロール可能な幅を提供する', async () => {
      // table の keyboard 到達性と wrapper の実測幅を確認し、親幅内の overflow を安全に操作できるようにする。
      await expect(table).toHaveAttribute('tabindex', '0');
      await expect(scrollContainer.clientWidth).toBeLessThanOrEqual(frame.clientWidth);
      await expect(scrollContainer.scrollWidth).toBeGreaterThan(scrollContainer.clientWidth);
      await expect(table.getBoundingClientRect().width).toBeGreaterThan(frame.clientWidth);
    });
  },
};

/**
 * 行がない場合も caption、列見出し、footer を残し、tbody に一つの空状態行を表示する Story。
 *
 * @remarks 空状態は公開 Table primitives と native `colSpan` だけで表現し、操作や製品固有導線を創作しない。
 * @example Storybook の `Components/Table/Empty` を開き、列構造を保った空状態を確認する。
 */
export const Empty: Story = {
  render: () => <TablePreview caption="空の固定項目一覧" rows={emptyRows} />,
  play: async ({ canvasElement, step }) => {
    // 空状態でも caption 由来の accessible name から table を取得できることを前提に内部構造を検証する。
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: '空の固定項目一覧' });
    const tableCanvas = within(table);
    const messageCell = tableCanvas.getByRole('cell', { name: emptyMessage });

    await step('caption と全列見出しを保ったまま空状態を一行で表示する', async () => {
      // header、空状態、footer の三行と caption の accessible name を確認し、空配列でも意味構造を失わせない。
      await expect(table).toHaveAccessibleName('空の固定項目一覧');
      await expect(tableCanvas.getAllByRole('columnheader')).toHaveLength(columnCount);
      await expect(tableCanvas.getAllByRole('row')).toHaveLength(3);
      await expect(messageCell).toBeVisible();
    });

    await step('空状態セルを全列へまたがらせる', async () => {
      // 固定列数と colSpan の一致を属性で確認し、空状態が途中列だけへ配置される退行を防ぐ。
      await expect(messageCell).toHaveAttribute('colspan', String(columnCount));
    });
  },
};
