import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
} from '@tanstack/react-table';

import type { ReactNode } from 'react';

/** compiled描画層へ渡す、一つの見出しセルの不変snapshot。 */
interface DataTableHeaderModel {
  /** Reactが見出しセルを同定するTanStack由来の安定ID。 */
  readonly id: string;
  /** 複数列へまたがる見出しが占有する列数。 */
  readonly colSpan: number;
  /** 現在のtable stateを反映して境界内で評価済みの見出し内容。 */
  readonly content: ReactNode;
}

/** compiled描画層へ渡す、一つの見出し行の不変snapshot。 */
interface DataTableHeaderGroupModel {
  /** Reactが見出し行を同定するTanStack由来の安定ID。 */
  readonly id: string;
  /** 表示順に評価済みの見出しセル。 */
  readonly headers: readonly DataTableHeaderModel[];
}

/** compiled描画層へ渡す、一つのデータセルの不変snapshot。 */
interface DataTableCellModel {
  /** Reactがデータセルを同定するTanStack由来の安定ID。 */
  readonly id: string;
  /** 現在のrow stateを反映して境界内で評価済みのセル内容。 */
  readonly content: ReactNode;
}

/** compiled描画層へ渡す、一つのデータ行の不変snapshot。 */
interface DataTableRowModel {
  /** Reactとrow selectionが共有するTanStack由来の安定ID。 */
  readonly id: string;
  /** snapshot生成時点で行が選択されているかを示す公開表示状態。 */
  readonly isSelected: boolean;
  /** 表示順に評価済みのデータセル。 */
  readonly cells: readonly DataTableCellModel[];
}

/** TanStackの可変instanceをcompiled描画層から隔離する不変snapshot。 */
interface DataTableRenderModel {
  /** 現在の列構成から評価した見出し行。 */
  readonly headerGroups: readonly DataTableHeaderGroupModel[];
  /** 現在のdataとtable stateから評価したデータ行。 */
  readonly rows: readonly DataTableRowModel[];
}

/**
 * DataTable が TanStack Table のモデルを生成するために必要な入力だけを表す。
 * 表示専用 props を含めず、変更可能な table model と共有 UI の描画責務を分離する。
 * 行選択を呼び出し元で制御する場合は、`rowSelection` と `onRowSelectionChange` を対で指定する。
 *
 * @typeParam TData テーブルの各行が持つデータ型。
 * @typeParam TValue 各列が評価する値の型。
 * @internal DataTable 実装だけが利用する内部契約であり、package entrypoint から公開しない。
 */
interface DataTableModelOptions<TData, TValue> {
  /** 列の見出し、セル表示、アクセシビリティ情報を定義する TanStack Table 列定義。 */
  columns: ColumnDef<TData, TValue>[];
  /** 表示する行データ。空配列の場合もそのまま table model へ渡す。 */
  data: TData[];
  /** 各行の安定した識別子を導出する関数。未指定時は TanStack Table の既定識別子を使用する。 */
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  /** 呼び出し元が所有し、行 ID ごとの選択状態を保持する TanStack Table の制御 state。 */
  rowSelection?: RowSelectionState;
  /** 行選択の更新要求を呼び出し元の制御 state へ反映する TanStack Table の updater。 */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

/**
 * DataTable 専用境界として TanStack Table の変更可能なモデルを生成する。
 * useReactTable と core row model の構築をこの内部 Hook に集約し、描画コンポーネントから
 * Compiler 非互換 API の直接利用を排除する。
 *
 * @typeParam TData テーブルの各行が持つデータ型。
 * @typeParam TValue 各列が評価する値の型。
 * @param options 列定義、行データ、任意の行識別子関数、および任意の制御行選択契約。
 * @returns 現在のcore row modelと行選択stateを評価済みの不変描画snapshot。
 * @internal DataTable 実装だけが利用する内部 Hook であり、package entrypoint から公開しない。
 * @example
 * ```tsx
 * const tableModel = useDataTableModel({ columns, data, getRowId });
 * ```
 */
function useDataTableModel<TData, TValue>({
  columns,
  data,
  getRowId,
  rowSelection,
  onRowSelectionChange,
}: DataTableModelOptions<TData, TValue>): DataTableRenderModel {
  // 制御値がない既存用途では TanStack Table の内部 state 管理を保ち、明示された入力だけを上書きする。
  const controlledRowSelectionOptions = {
    ...(rowSelection === undefined ? {} : { state: { rowSelection } }),
    ...(onRowSelectionChange === undefined ? {} : { onRowSelectionChange }),
  };

  // core row model の生成と useReactTable 呼び出しを同じ専用境界へ閉じ込める。
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    ...controlledRowSelectionOptions,
  });

  // 可変なHeaderとColumn contextを境界内で評価し、描画層には新しい不変値だけを渡す。
  const headerGroups = table.getHeaderGroups().map((headerGroup) => ({
    id: headerGroup.id,
    headers: headerGroup.headers.map((header) => ({
      id: header.id,
      colSpan: header.colSpan,
      content: header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext()),
    })),
  }));

  // 可変なRowとCell contextを境界内で評価し、選択状態をReactNodeとprimitiveへ固定する。
  const rows = table.getRowModel().rows.map((row) => ({
    id: row.id,
    isSelected: row.getIsSelected(),
    cells: row.getVisibleCells().map((cell) => ({
      id: cell.id,
      content: flexRender(cell.column.columnDef.cell, cell.getContext()),
    })),
  }));

  return { headerGroups, rows };
}

export { type DataTableModelOptions, useDataTableModel };
