import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataTable } from '@cfreact-template/ui/components/data-table';

import type { ColumnDef } from '@tanstack/react-table';

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
});
