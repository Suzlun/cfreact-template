import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Calendar } from '@cfreact-template/ui/components/calendar';

describe('Calendar', () => {
  it('日付範囲の開始日・中間日・終了日を描画する', () => {
    const { container } = render(
      <Calendar
        mode="range"
        month={new Date(2026, 0, 1)}
        selected={{ from: new Date(2026, 0, 5), to: new Date(2026, 0, 7) }}
      />
    );

    expect(container.querySelector('[data-range-start="true"]')).not.toBeNull();
    expect(container.querySelector('[data-range-middle="true"]')).not.toBeNull();
    expect(container.querySelector('[data-range-end="true"]')).not.toBeNull();
  });
});
