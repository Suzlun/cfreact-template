import { SaveIcon } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Kbd } from '@cfreact-template/ui/components/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@cfreact-template/ui/components/tooltip';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** shadcn/ui 公式例の表示内容と、Tooltip に依存しないキーボード説明を一つの契約へ揃える。 */
const saveActionCopy = {
  description: 'Keyboard shortcut: S.',
  descriptionId: 'tooltip-save-action-description',
  label: 'Save Changes',
  shortcut: 'S',
} as const;

/**
 * shadcn/ui 公式の Tooltip 構成を Storybook の documentation と interaction test へ登録する。
 *
 * Provider は公式 installation と同じアプリケーション境界として置き、製品利用時と異なる delay や
 * animation 設定は加えない。Tooltip の見た目は既存 component と semantic token に委ねる。
 */
const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  subcomponents: {
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式の With Keyboard Shortcut 例です。Tooltip は hover または keyboard focus で表示する視覚的な補助ラベルとし、保存操作の名前とショートカット説明は閉状態でも支援技術へ提供します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Tooltip>;

/** Storybook が Tooltip の Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

/** metadata から Tooltip Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式の保存アイコン操作を表示し、hover・focus・アクセシブルな説明の利用者契約を確認する。
 *
 * @remarks Popup の animation 状態や Base UI の内部 data 属性は検証せず、利用者が操作して得る名前と
 * 説明だけを検証する。
 */
export const SaveAction: Story = {
  render: () => (
    <>
      {/* Tooltip が表示できない入力手段でも、ショートカットを保存操作の説明として取得できるようにする。 */}
      <span className="sr-only" id={saveActionCopy.descriptionId}>
        {saveActionCopy.description}
      </span>

      <Tooltip>
        {/* 公式 render を使い、icon-only button の名前と native button semantics を常時提供する。 */}
        <TooltipTrigger
          aria-describedby={saveActionCopy.descriptionId}
          aria-label={saveActionCopy.label}
          render={
            <Button size="icon-sm" type="button" variant="outline">
              <SaveIcon aria-hidden="true" />
            </Button>
          }
        />

        {/* 公式例と同じ短い保存ラベルと既存 Kbd を、視覚利用者向けの補助情報として表示する。 */}
        <TooltipContent role="tooltip">
          {saveActionCopy.label} <Kbd aria-hidden="true">{saveActionCopy.shortcut}</Kbd>
        </TooltipContent>
      </Tooltip>
    </>
  ),
  play: async ({ canvasElement, step }) => {
    // Trigger は canvas、Portal 内の TooltipContent は同じ document body から利用者向け role で取得する。
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: saveActionCopy.label });

    await step('閉状態でも保存操作の名前とショートカット説明を提供する', async () => {
      // Tooltip の mount 状態に依存せず、icon-only button が名前・説明・native type を持つことを保証する。
      await expect(trigger).toHaveAttribute('type', 'button');
      await expect(trigger).toHaveAccessibleName(saveActionCopy.label);
      await expect(trigger).toHaveAccessibleDescription(saveActionCopy.description);
      await expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('pointer hover で保存ラベルとショートカットを提示する', async () => {
      // 実際の hover 操作後、内部状態属性ではなく tooltip role と表示内容を利用者契約として確認する。
      await userEvent.hover(trigger);
      const content = await documentBody.findByRole('tooltip', { name: saveActionCopy.label });
      await expect(content).toHaveTextContent(saveActionCopy.label);
      await expect(within(content).getByText(saveActionCopy.shortcut)).toBeInTheDocument();
      await userEvent.unhover(trigger);
    });

    await step('Tab focus でも同じ保存ラベルとショートカットを提示する', async () => {
      // 通常の keyboard 順序で icon button へ到達し、hover と同じ説明を得られることを確認する。
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      const content = await documentBody.findByRole('tooltip', { name: saveActionCopy.label });
      await expect(content).toHaveTextContent(saveActionCopy.label);
      await expect(within(content).getByText(saveActionCopy.shortcut)).toBeInTheDocument();
    });
  },
};
