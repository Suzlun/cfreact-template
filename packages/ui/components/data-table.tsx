import * as React from 'react';
import { flexRender } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@cfreact-template/ui/components/table';
import { cn } from '@cfreact-template/ui/lib/utils';

import { useDataTableModel, type DataTableModelOptions } from './data-table-model';

/**
 * 共通 DataTable の入力値。
 * 列定義と行データは TanStack Table の型で受け取り、行識別子は必要な場合だけ呼び出し元が指定する。
 * 表示順序や並び替え状態は呼び出し元の列定義とデータに従い、このコンポーネントは独自の server state を持たない。
 *
 * @typeParam TData テーブルの各行が持つデータ型。
 * @typeParam TValue 各列が評価する値の型。
 */
interface DataTableProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement>, DataTableModelOptions<TData, TValue> {
  /** 行が存在しない場合に表へ表示するメッセージ。省略時は英語の既定文言を使用する。 */
  emptyMessage?: React.ReactNode;
  /** table 要素へ付与する caption。表の目的を支援技術へ伝える場合に指定する。 */
  caption?: React.ReactNode;
}

/**
 * TanStack Table の列定義とデータを、共通 Table primitives でアクセシブルに描画する。
 * ページング、フィルタ、並び替えの状態は呼び出し元が列定義とデータを通して制御できるため、テンプレート固有の一覧画面へ依存しない。
 *
 * @typeParam TData テーブルの各行が持つデータ型。
 * @typeParam TValue 各列が評価する値の型。
 * @param props 列定義、行データ、空状態、caption、任意の行識別子と div 属性。
 * @returns 見出し、セル、空状態を持つ共通デザインの table。
 * @example
 * ```tsx
 * <DataTable columns={columns} data={users} caption="Users" />
 * ```
 */
function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = 'No results.',
  caption,
  getRowId,
  className,
  ...props
}: DataTableProps<TData, TValue>) {
  const table = useDataTableModel({ columns, data, getRowId });

  return (
    <div
      className={cn('relative w-full overflow-auto', className)}
      data-slot="data-table"
      {...props}
    >
      <Table>
        {caption != null && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={Math.max(columns.length, 1)}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { DataTable, type DataTableProps };
