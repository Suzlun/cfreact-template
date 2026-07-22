import { expect, within } from 'storybook/test';

import { Progress, ProgressLabel, ProgressValue } from '@cfreact-template/ui/components/progress';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 公式 shadcn/ui Docs と Examples の label/value composition を Storybook へ登録する。
 *
 * 固定の利用例だけを示すため Controls は無効化し、公式 render の可視構造を変更しない。
 */
const meta = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Progress>;

/** Storybook が Progress の公式利用例と interaction test を収集するための既定 export。 */
export default meta;

/** metadata から Progress Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Docs と Examples と同じ、Upload progress が 56% 完了した状態を表示する。 */
export const Upload: Story = {
  args: { value: 56 },
  render: () => (
    <Progress value={56} className="w-full max-w-sm">
      <ProgressLabel>Upload progress</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
  play: async ({ canvasElement }) => {
    // Story canvas に検索範囲を限定し、公式例が利用者へ示す label、value、progressbar を取得する。
    const canvas = within(canvasElement);
    const label = canvas.getByText('Upload progress');
    const value = canvas.getByText('56%');
    const progress = canvas.getByRole('progressbar', { name: 'Upload progress' });

    // 可視 label と value、および同じ名前と現在値を持つ progressbar の利用者向け契約だけを検証する。
    await expect(label).toBeVisible();
    await expect(value).toBeVisible();
    await expect(progress).toHaveAttribute('aria-valuenow', '56');
  },
};
