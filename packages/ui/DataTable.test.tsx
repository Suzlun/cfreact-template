import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Checkbox } from '@cfreact-template/ui/components/checkbox';
import { DataTable } from '@cfreact-template/ui/components/data-table';

import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';

interface UserRow {
  id: string;
  name: string;
}

const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
];

/** 利用者が行選択を操作できる列を、公開されるchecked状態へ接続する。 */
const selectionColumns: ColumnDef<UserRow>[] = [
  {
    id: 'select',
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select user ${row.original.id}`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => {
          // Base UIが通知した次の状態をTanStackの行選択更新へそのまま渡す。
          row.toggleSelected(checked);
        }}
      />
    ),
  },
  ...columns,
];

/** 制御行選択の確認に使う固定行。 */
const selectableUsers: UserRow[] = [{ id: 'user-1', name: 'Ada Lovelace' }];

/** 固定行の業務識別子をTanStackの選択キーとして返す。 */
const getUserRowId = (user: UserRow) => user.id;

/**
 * 呼び出し元が所有するrow selectionを共通DataTableへ接続する。
 *
 * @returns 利用者が公開checkboxを操作できる制御DataTable。
 */
function ControlledSelectionTable() {
  // 公式shadcn例と同じく、選択stateとupdaterを同じ呼び出し元で所有する。
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return (
    <DataTable
      columns={selectionColumns}
      data={selectableUsers}
      getRowId={getUserRowId}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
    />
  );
}

describe('DataTable', () => {
  it('列定義と行データを共通テーブルとして描画する', () => {
    render(
      <DataTable
        caption="Users"
        columns={columns}
        data={[{ id: 'user-1', name: 'Ada Lovelace' }]}
      />
    );

    expect(screen.getByRole('table', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  it('行がない場合は空状態を表示する', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No users available" />);

    expect(screen.getByText('No users available')).toBeInTheDocument();
  });

  it('制御行選択をクリックすると公開checkboxがchecked状態になる', () => {
    render(<ControlledSelectionTable />);
    const rowCheckboxName = 'Select user user-1';

    // 利用者が認識して操作するcheckbox自体をクリックする。
    fireEvent.click(screen.getByRole('checkbox', { name: rowCheckboxName }));

    // callback回数や内部stateではなく、同じ公開checkboxのchecked状態を検証する。
    expect(screen.getByRole('checkbox', { name: rowCheckboxName, checked: true })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
});
