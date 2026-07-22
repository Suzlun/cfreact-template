import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Checkbox } from '@cfreact-template/ui/components/checkbox';
import { DataTable } from '@cfreact-template/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cfreact-template/ui/components/dropdown-menu';
import { Input } from '@cfreact-template/ui/components/input';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';

/** 公式 payment 例と同じ四つの処理状態。 */
type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

/** メール列の親制御 sorting 状態。 */
type EmailSortDirection = 'none' | 'ascending' | 'descending';

/**
 * 公式 Data Table の recent payments 例が扱う一行分のデータ。
 *
 * Story は外部通信や現在日時へ依存せず、この固定契約の値だけを DataTable へ渡す。
 */
interface Payment {
  /** 行選択と row action が参照する、一意で安定した支払い識別子。 */
  readonly id: string;
  /** USD で表示する支払い金額。 */
  readonly amount: number;
  /** 支払いの処理段階。 */
  readonly status: PaymentStatus;
  /** 顧客を識別する連絡先メールアドレス。 */
  readonly email: string;
}

/** toolbar が現在値と親制御 callback を受け取るための入力。 */
interface PaymentTableToolbarProps {
  /** メールアドレスへ適用中の filter 文字列。 */
  readonly emailFilter: string;
  /** status 列を表示しているかを示す値。 */
  readonly statusVisible: boolean;
  /** email 列を表示しているかを示す値。 */
  readonly emailVisible: boolean;
  /** amount 列を表示しているかを示す値。 */
  readonly amountVisible: boolean;
  /** filter 入力を親状態へ反映する callback。 */
  readonly onEmailFilterChange: (value: string) => void;
  /** status 列の表示状態を親へ通知する callback。 */
  readonly onStatusVisibilityChange: (visible: boolean) => void;
  /** email 列の表示状態を親へ通知する callback。 */
  readonly onEmailVisibilityChange: (visible: boolean) => void;
  /** amount 列の表示状態を親へ通知する callback。 */
  readonly onAmountVisibilityChange: (visible: boolean) => void;
}

/** pagination footer が現在位置と親制御 callback を受け取るための入力。 */
interface PaymentTablePaginationProps {
  /** 1 から始まる現在ページ番号。 */
  readonly currentPage: number;
  /** filter 後の総ページ数。空結果でも一ページとして表示する。 */
  readonly pageCount: number;
  /** 前ページへ移動できるかを示す値。 */
  readonly canGoPrevious: boolean;
  /** 次ページへ移動できるかを示す値。 */
  readonly canGoNext: boolean;
  /** 前ページ操作を親へ通知する callback。 */
  readonly onPreviousPage: () => void;
  /** 次ページ操作を親へ通知する callback。 */
  readonly onNextPage: () => void;
}

/** 公式 registry source が表示する五件を同じ値と順序で保持する。 */
const payments = [
  {
    id: 'm5gr84i9',
    amount: 316,
    status: 'success',
    email: 'ken99@example.com',
  },
  {
    id: '3u1reuv4',
    amount: 242,
    status: 'success',
    email: 'Abe45@example.com',
  },
  {
    id: 'derv1ws0',
    amount: 837,
    status: 'processing',
    email: 'Monserrat44@example.com',
  },
  {
    id: '5kma53ae',
    amount: 874,
    status: 'success',
    email: 'Silas22@example.com',
  },
  {
    id: 'bhqecj4p',
    amount: 721,
    status: 'failed',
    email: 'carmella@example.com',
  },
] as const satisfies readonly Payment[];

/** 実行環境の locale や通貨既定値に左右されず、公式例と同じ USD 表記を生成する。 */
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** 大文字小文字を表示上の差として扱わず、固定 locale で email 順を決定する。 */
const emailCollator = new Intl.Collator('en-US', { sensitivity: 'base' });

/** pagination の両方向を実際に確認できるよう、公式五件を三件ずつ表示する。 */
const paymentsPerPage = 3;

/** 見た目へ追加の chrome を置かず、table の目的を支援技術へ伝える caption。 */
const accessibleCaption = <span className="sr-only">Recent payments</span>;

/** 公式 Data Table 例と同じ空結果文言。 */
const emptyMessage = 'No results.';

/** 行選択列を現在ページの TanStack row model へ接続する。 */
const paymentSelectionColumn: ColumnDef<Payment> = {
  id: 'select',
  header: ({ table }) => {
    // 現在ページに行がある場合だけ全選択を有効にし、空結果の無効操作を避ける。
    const hasRows = table.getRowModel().rows.length > 0;
    const allRowsSelected = table.getIsAllRowsSelected();

    return (
      <Checkbox
        aria-label="Select all payments on this page"
        checked={allRowsSelected}
        disabled={!hasRows}
        indeterminate={!allRowsSelected && table.getIsSomeRowsSelected()}
        onCheckedChange={(checked) => {
          table.toggleAllRowsSelected(checked);
        }}
      />
    );
  },
  cell: ({ row }) => (
    <Checkbox
      aria-label={`Select payment ${row.original.id}`}
      checked={row.getIsSelected()}
      onCheckedChange={(checked) => {
        row.toggleSelected(checked);
      }}
    />
  ),
};

/** 公式例の status 値を追加装飾なしの可視テキストとして表示する。 */
const paymentStatusColumn: ColumnDef<Payment> = {
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => <div className="capitalize">{row.original.status}</div>,
};

/** 公式例の amount 列を右揃えの USD として表示する。 */
const paymentAmountColumn: ColumnDef<Payment> = {
  accessorKey: 'amount',
  header: () => <div className="text-right">Amount</div>,
  cell: ({ row }) => (
    // tabular numbers で桁の走査性を保ち、formatter の固定結果だけを表示する。
    <div className="text-right font-medium tabular-nums">
      {usdFormatter.format(row.original.amount)}
    </div>
  ),
};

/**
 * 各支払い行へ公式例と同じ情報構造の操作 menu を提供する。
 *
 * @param props 操作対象を一意に示す支払いデータ。
 * @returns 支払い ID の複製、顧客確認、詳細確認を示す row action menu。
 */
function PaymentRowActions({ payment }: { readonly payment: Payment }) {
  // 同じ省略アイコンを持つ各 trigger と menu を、固定 payment ID で一意に命名する。
  const menuName = `Actions for ${payment.id}`;

  return (
    // Storybook canvas と Portal menu を連続して keyboard 操作できるよう non-modal にする。
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<Button type="button" variant="ghost" size="icon" className="size-8" />}
      >
        <MoreHorizontal aria-hidden="true" />
        <span className="sr-only">Open {menuName.toLowerCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={menuName} className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {/* Story では clipboard や navigation を発生させず、公式の操作候補だけを提示する。 */}
          <DropdownMenuItem>Copy payment ID</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View customer</DropdownMenuItem>
          <DropdownMenuItem>View payment details</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 公式例の row actions を右端へ揃え、表示切替と sorting の対象外にする。 */
const paymentActionsColumn: ColumnDef<Payment> = {
  id: 'actions',
  header: () => <span className="sr-only">Actions</span>,
  cell: ({ row }) => (
    <div className="flex justify-end">
      <PaymentRowActions payment={row.original} />
    </div>
  ),
};

/** 現在の sorting 状態ごとに、次の操作を明示する accessible name。 */
const emailSortLabels: Record<EmailSortDirection, string> = {
  none: 'Sort emails ascending',
  ascending: 'Sort emails descending; currently ascending',
  descending: 'Sort emails ascending; currently descending',
};

/**
 * 現在のsorting状態から、次の操作を伝える固定ラベルを安全に選択する。
 *
 * @param direction email列の現在のsorting方向。
 * @returns header buttonへ付与する、現在状態と次操作を含むアクセシブルネーム。
 */
function getEmailSortLabel(direction: EmailSortDirection): string {
  // 有限なunionを明示的に分岐し、動的なobject propertyアクセスへ依存せず全状態を扱う。
  switch (direction) {
    case 'ascending':
      return emailSortLabels.ascending;
    case 'descending':
      return emailSortLabels.descending;
    case 'none':
      return emailSortLabels.none;
  }
}

/**
 * 公式の sortable email header を、親制御データ変換へ接続した列として生成する。
 *
 * @param direction 現在の email sorting 状態。
 * @param onSortDirectionChange header button が次状態を要求するときの callback。
 * @returns lowercase cell と accessible sorting button を持つ email 列。
 */
function createPaymentEmailColumn(
  direction: EmailSortDirection,
  onSortDirectionChange: () => void
): ColumnDef<Payment> {
  return {
    accessorKey: 'email',
    header: () => (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2"
        aria-label={getEmailSortLabel(direction)}
        onClick={onSortDirectionChange}
      >
        Email
        <ArrowUpDown aria-hidden="true" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.original.email}</div>,
  };
}

/**
 * 公式 Columns menu を、親制御の三つの可視データ列へ接続する。
 *
 * @param props 現在の可視状態と、それぞれを更新する callback。
 * @returns 狭幅では右端、広幅では filter と同じ行へ配置される checkbox menu。
 */
function PaymentColumnsMenu({
  statusVisible,
  emailVisible,
  amountVisible,
  onStatusVisibilityChange,
  onEmailVisibilityChange,
  onAmountVisibilityChange,
}: Omit<PaymentTableToolbarProps, 'emailFilter' | 'onEmailFilterChange'>) {
  return (
    <div className="self-end sm:ml-auto">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" />}>
          Columns
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" aria-label="Payment columns" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusVisible}
              onCheckedChange={onStatusVisibilityChange}
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={emailVisible}
              onCheckedChange={onEmailVisibilityChange}
            >
              Email
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={amountVisible}
              onCheckedChange={onAmountVisibilityChange}
            >
              Amount
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * 公式 filter input と Columns menu を responsive toolbar として構成する。
 *
 * @param props filter 値、三列の可視状態、親制御 callback。
 * @returns 390px では縦、広幅では横へ並ぶ table toolbar。
 */
function PaymentTableToolbar({
  emailFilter,
  statusVisible,
  emailVisible,
  amountVisible,
  onEmailFilterChange,
  onStatusVisibilityChange,
  onEmailVisibilityChange,
  onAmountVisibilityChange,
}: PaymentTableToolbarProps) {
  return (
    <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center">
      <Input
        aria-label="Filter payment emails"
        placeholder="Filter emails..."
        value={emailFilter}
        onChange={(event) => {
          onEmailFilterChange(event.currentTarget.value);
        }}
        className="sm:max-w-sm"
      />
      <PaymentColumnsMenu
        statusVisible={statusVisible}
        emailVisible={emailVisible}
        amountVisible={amountVisible}
        onStatusVisibilityChange={onStatusVisibilityChange}
        onEmailVisibilityChange={onEmailVisibilityChange}
        onAmountVisibilityChange={onAmountVisibilityChange}
      />
    </div>
  );
}

/**
 * 現在ページと前後移動を、公式例と同じ二つの outline button で表示する。
 *
 * @param props ページ位置、移動可否、親制御 callback。
 * @returns 状態を通知する live text と Previous / Next controls。
 */
function PaymentTablePagination({
  currentPage,
  pageCount,
  canGoPrevious,
  canGoNext,
  onPreviousPage,
  onNextPage,
}: PaymentTablePaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Page {currentPage} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoPrevious}
          onClick={onPreviousPage}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={onNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/**
 * 固定 payments を email filter へ適用する。
 *
 * @param sourcePayments filter 対象の固定支払い行。
 * @param query 利用者が入力した email 部分文字列。
 * @returns 大文字小文字を区別せず query を含む新しい行配列。
 */
function filterPayments(sourcePayments: readonly Payment[], query: string) {
  // 前後空白と大文字小文字を正規化し、表示中の lowercase email と検索挙動を一致させる。
  const normalizedQuery = query.trim().toLocaleLowerCase('en-US');
  return normalizedQuery === ''
    ? [...sourcePayments]
    : sourcePayments.filter((payment) =>
        payment.email.toLocaleLowerCase('en-US').includes(normalizedQuery)
      );
}

/**
 * filter 済み payments を現在の email sorting 状態へ適用する。
 *
 * @param sourcePayments sorting 対象の支払い行。
 * @param direction 未整列、昇順、降順の現在状態。
 * @returns 元配列を変更せず、指定順に並ぶ新しい行配列。
 */
function sortPayments(sourcePayments: readonly Payment[], direction: EmailSortDirection) {
  if (direction === 'none') {
    return [...sourcePayments];
  }

  // Story 間で共有する公式データを変更しないよう、配列を複製してから指定方向へ並べ替える。
  return [...sourcePayments].sort((leftPayment, rightPayment) => {
    const comparison = emailCollator.compare(leftPayment.email, rightPayment.email);
    return direction === 'ascending' ? comparison : -comparison;
  });
}

/**
 * sorting 済み payments から現在ページ分だけを取り出す。
 *
 * @param sourcePayments pagination 対象の支払い行。
 * @param pageIndex 0 から始まる現在ページ位置。
 * @returns 固定 page size に収まる現在ページの行配列。
 */
function paginatePayments(sourcePayments: readonly Payment[], pageIndex: number) {
  // 先頭 index を一度だけ算出し、開始と終了を同じ page size へ揃える。
  const firstPaymentIndex = pageIndex * paymentsPerPage;
  return sourcePayments.slice(firstPaymentIndex, firstPaymentIndex + paymentsPerPage);
}

/** `getRowId` が payment ID をそのまま安定した TanStack row identity として返す。 */
const getPaymentRowId = (payment: Payment) => payment.id;

/**
 * 公式 payment demo の操作を、DataTable のデータ入力と制御行選択契約で合成する。
 *
 * @returns filtering、sorting、visibility、pagination、selection、row actions を持つ支払い表。
 */
function PaymentTableExample() {
  // 公式例の利用者操作 state を Story で所有し、共有 DataTable へ TanStack の制御契約だけを渡す。
  const [emailFilter, setEmailFilter] = useState('');
  const [emailSortDirection, setEmailSortDirection] = useState<EmailSortDirection>('none');
  const [pageIndex, setPageIndex] = useState(0);
  const [statusVisible, setStatusVisible] = useState(true);
  const [emailVisible, setEmailVisible] = useState(true);
  const [amountVisible, setAmountVisible] = useState(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // filter、sorting、pagination の順に同期導出し、派生値を追加 state として保持しない。
  const filteredPayments = filterPayments(payments, emailFilter);
  const sortedPayments = sortPayments(filteredPayments, emailSortDirection);
  const pageCount = Math.max(1, Math.ceil(sortedPayments.length / paymentsPerPage));
  const visiblePayments = paginatePayments(sortedPayments, pageIndex);

  /** filter 変更時に結果とページ位置を同時に更新する。 */
  function handleEmailFilterChange(value: string) {
    setEmailFilter(value);
    setPageIndex(0);
  }

  /** 公式 header button と同じく、初回は昇順、その後は昇順と降順を交互に切り替える。 */
  function handleEmailSortDirectionChange() {
    setEmailSortDirection((currentDirection) =>
      currentDirection === 'ascending' ? 'descending' : 'ascending'
    );
    setPageIndex(0);
  }

  // 選択と row actions を両端へ固定し、各表示状態を既存 columns API の入力へ直接変換する。
  const columns: ColumnDef<Payment>[] = [
    paymentSelectionColumn,
    ...(statusVisible ? [paymentStatusColumn] : []),
    ...(emailVisible
      ? [createPaymentEmailColumn(emailSortDirection, handleEmailSortDirectionChange)]
      : []),
    ...(amountVisible ? [paymentAmountColumn] : []),
    paymentActionsColumn,
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PaymentTableToolbar
        emailFilter={emailFilter}
        statusVisible={statusVisible}
        emailVisible={emailVisible}
        amountVisible={amountVisible}
        onEmailFilterChange={handleEmailFilterChange}
        onStatusVisibilityChange={setStatusVisible}
        onEmailVisibilityChange={setEmailVisible}
        onAmountVisibilityChange={setAmountVisible}
      />
      <DataTable
        aria-label="Scrollable recent payments table"
        caption={accessibleCaption}
        columns={columns}
        data={visiblePayments}
        emptyMessage={emptyMessage}
        getRowId={getPaymentRowId}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        role="region"
        tabIndex={0}
        className="rounded-md border [&_[data-slot=table-container]]:w-max [&_[data-slot=table-container]]:overflow-visible [&_[data-slot=table]]:min-w-xl"
      />
      <PaymentTablePagination
        currentPage={pageIndex + 1}
        pageCount={pageCount}
        canGoPrevious={pageIndex > 0}
        canGoNext={pageIndex + 1 < pageCount}
        onPreviousPage={() => {
          setPageIndex((currentPage) => currentPage - 1);
        }}
        onNextPage={() => {
          setPageIndex((currentPage) => currentPage + 1);
        }}
      />
    </div>
  );
}

/** 公式 payment demo を、既存 DataTable API と repository tokens で実用 Story として登録する。 */
const meta = {
  title: 'Components/Data Table',
  component: PaymentTableExample,
  parameters: {
    layout: 'padded',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'A realistic recent-payments table based on the official shadcn/ui example, composed with the current DataTable contract and shared controls.',
      },
    },
  },
} satisfies Meta<typeof PaymentTableExample>;

/** Storybook が Data Table catalog module を解決する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式例の filtering、sorting、visibility、pagination、selection、row actions を一つの表で示す。
 *
 * @example Storybook の `Components/Data Table/Recent payments` で各操作を keyboard または pointer で確認する。
 */
export const RecentPayments: Story = {
  name: 'Recent payments',
  render: () => <PaymentTableExample />,
  play: async ({ canvasElement, step }) => {
    // caption 由来の名前で table を限定し、Storybook manager UI を検索対象から除外する。
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Recent payments' });
    const tableCanvas = within(table);
    const filterInput = canvas.getByRole('textbox', { name: 'Filter payment emails' });

    await step('公式列、最初のページ、responsive scroll region を表示する', async () => {
      // 選択と actions を含む全列、三行、ページ状態を同じ初期表示で保証する。
      await expect(tableCanvas.getAllByRole('columnheader')).toHaveLength(5);
      await expect(tableCanvas.getAllByRole('row')).toHaveLength(paymentsPerPage + 1);
      await expect(tableCanvas.getByRole('cell', { name: '$316.00' })).toBeVisible();
      await expect(canvas.getByText('Page 1 of 2')).toBeVisible();
      await expect(
        canvas.getByRole('region', { name: 'Scrollable recent payments table' })
      ).toHaveAttribute('tabindex', '0');
    });

    await step('一行の選択を checkbox と全選択の mixed state へ反映する', async () => {
      // 固定 ID で先頭行を選択し、状態反映後の DOM から同じ checkbox の公開状態を取得する。
      const rowCheckboxName = `Select payment ${payments[0].id}`;
      const rowCheckbox = tableCanvas.getByRole('checkbox', { name: rowCheckboxName });

      await userEvent.click(rowCheckbox);
      const selectedRowCheckbox = await tableCanvas.findByRole('checkbox', {
        name: rowCheckboxName,
        checked: true,
      });

      await expect(selectedRowCheckbox).toHaveAttribute('aria-checked', 'true');
      await expect(
        tableCanvas.getByRole('checkbox', { name: 'Select all payments on this page' })
      ).toHaveAttribute('aria-checked', 'mixed');
    });

    await step('email header から昇順へ並べ替える', async () => {
      // 初期 sorting label を操作し、親で変換された先頭行と次操作の accessible name を確認する。
      await userEvent.click(canvas.getByRole('button', { name: 'Sort emails ascending' }));
      const firstPaymentRow = tableCanvas.getAllByRole('row')[1];

      if (firstPaymentRow === undefined) {
        throw new TypeError('sorting 後の先頭 payment row が見つかりません。');
      }

      await expect(within(firstPaymentRow).getByText(payments[1].email)).toBeVisible();
      await expect(
        canvas.getByRole('button', {
          name: 'Sort emails descending; currently ascending',
        })
      ).toBeVisible();
    });

    await step('email filter と空結果を同じ table semantics 内へ反映する', async () => {
      // 一件へ絞り込んだ後に不一致値を追加し、列を残した空状態と無効な全選択を確認する。
      await userEvent.type(filterInput, 'carmella');
      await expect(tableCanvas.getAllByRole('row')).toHaveLength(2);
      await expect(tableCanvas.getByRole('cell', { name: 'carmella@example.com' })).toBeVisible();
      await expect(canvas.getByText('Page 1 of 1')).toBeVisible();

      await userEvent.type(filterInput, '-missing');
      await expect(tableCanvas.getByRole('cell', { name: emptyMessage })).toBeVisible();
      await expect(
        tableCanvas.getByRole('checkbox', { name: 'Select all payments on this page' })
      ).toHaveAttribute('aria-disabled', 'true');

      // 後続の pagination と row action を初期母集団で検証できるよう filter だけを解除する。
      await userEvent.clear(filterInput);
      await expect(tableCanvas.getAllByRole('row')).toHaveLength(paymentsPerPage + 1);
    });

    await step('前後ページを移動し、現在ページの行だけを DataTable へ渡す', async () => {
      // 昇順の二ページ目へ進み、残り二行と button state を確認してから先頭へ戻す。
      const nextButton = canvas.getByRole('button', { name: 'Next' });
      const previousButton = canvas.getByRole('button', { name: 'Previous' });

      await userEvent.click(nextButton);
      await expect(canvas.getByText('Page 2 of 2')).toBeVisible();
      await expect(tableCanvas.getAllByRole('row')).toHaveLength(3);
      await expect(previousButton).toBeEnabled();
      await expect(nextButton).toBeDisabled();

      await userEvent.click(previousButton);
      await expect(canvas.getByText('Page 1 of 2')).toBeVisible();
    });
  },
};
