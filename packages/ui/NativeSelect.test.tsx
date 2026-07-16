import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@cfreact-template/ui/components/native-select';

describe('NativeSelect', () => {
  it('標準 select として選択値を変更できる', () => {
    render(
      <label>
        Role
        <NativeSelect defaultValue="member">
          <NativeSelectOption value="admin">Admin</NativeSelectOption>
          <NativeSelectOption value="member">Member</NativeSelectOption>
        </NativeSelect>
      </label>
    );

    const select = screen.getByRole('combobox', { name: 'Role' });
    expect(select).toHaveValue('member');

    fireEvent.change(select, { target: { value: 'admin' } });
    expect(select).toHaveValue('admin');
  });

  it('選択肢グループと無効状態を標準要素として保持する', () => {
    render(
      <NativeSelect aria-label="Plan" disabled>
        <NativeSelectOptGroup label="Plans">
          <NativeSelectOption value="starter">Starter</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    );

    expect(screen.getByRole('combobox', { name: 'Plan' })).toBeDisabled();
    expect(screen.getByRole('group', { name: 'Plans' })).toBeInTheDocument();
  });
});
