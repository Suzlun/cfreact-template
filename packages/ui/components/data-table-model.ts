import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type Table,
} from '@tanstack/react-table';

/**
 * DataTable が TanStack Table のモデルを生成するために必要な入力だけを表す。
 * 表示専用 props を含めず、変更可能な table model と共有 UI の描画責務を分離する。
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
}

/**
 * DataTable 専用境界として TanStack Table の変更可能なモデルを生成する。
 * useReactTable と core row model の構築をこの内部 Hook に集約し、描画コンポーネントから
 * Compiler 非互換 API の直接利用を排除する。
 *
 * @typeParam TData テーブルの各行が持つデータ型。
 * @typeParam TValue 各列が評価する値の型。
 * @param options 列定義、行データ、および任意の行識別子関数。
 * @returns 従来の DataTable と同じ core row model を持つ TanStack Table インスタンス。
 * @internal DataTable 実装だけが利用する内部 Hook であり、package entrypoint から公開しない。
 * @example
 * ```tsx
 * const table = useDataTableModel({ columns, data, getRowId });
 * ```
 */
function useDataTableModel<TData, TValue>({
  columns,
  data,
  getRowId,
}: DataTableModelOptions<TData, TValue>): Table<TData> {
  // core row model の生成と useReactTable 呼び出しを同じ専用境界へ閉じ込める。
  return useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });
}

export { type DataTableModelOptions, useDataTableModel };
