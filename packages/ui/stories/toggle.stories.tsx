import { BoldIcon, ItalicIcon } from 'lucide-react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';

import { Toggle } from '@cfreact-template/ui/components/toggle';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** interaction tests が二状態ボタンの選択状態を検証するために参照する ARIA 属性名。 */
const pressedAttribute = 'aria-pressed';

/**
 * shadcn/ui 公式 Base UI Toggle の実用例を Docs、accessibility、theme、viewport 検証へ登録する。
 *
 * Controls による props matrix は作らず、公式 Docs と base-nova Examples が示す Default、Outline、
 * With Text、Size、Disabled の各用途を独立した Story として扱う。
 */
const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Base UI Toggle Docs・base-nova Examples・registry/source に準拠した実用例です。Default、Outline、With Text、Size、Disabled を、アクセシブルネーム、aria-pressed、キーボードフォーカスとともに示し、共通 Storybook 設定により light/dark と 390px viewport でも検証します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Toggle>;

/** Storybook が Toggle catalog の Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

/** metadata から各 Toggle Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式 Basic 例に沿い、既定 variant の icon-only 太字 Toggle を押下済みで表示する。
 * Tab、Space、クリックを順に使い、名前、focus、`aria-pressed`、状態変更通知を検証する。
 */
export const Default: Story = {
  args: {
    onPressedChange: fn(),
  },
  render: ({ onPressedChange }) => (
    <Toggle aria-label="Toggle bold" defaultPressed onPressedChange={onPressedChange}>
      <BoldIcon aria-hidden />
    </Toggle>
  ),
  play: async ({ args, canvasElement, step }) => {
    // 公式例と同じ操作名から button を取得し、Storybook 本体の toolbar を検索対象から除外する。
    const toggle = within(canvasElement).getByRole('button', { name: 'Toggle bold' });

    await step('押下済み二状態ボタンとして名前と状態を公開する', async () => {
      // icon-only 操作へ aria-label が名前を与え、初期の on 状態が視覚だけでなく ARIA でも伝わることを確認する。
      await expect(toggle).toHaveAccessibleName('Toggle bold');
      await expect(toggle).toHaveAttribute(pressedAttribute, 'true');
      await expect(toggle).toBeEnabled();
    });

    await step('Tab と Space で focus と押下状態を切り替える', async () => {
      // 現在の focus を解放し、pointer を使わず通常の Tab 順だけで Toggle へ到達できることを確認する。
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      await userEvent.tab();
      await expect(toggle).toHaveFocus();

      // 標準 button と同じ Space 操作で off へ移り、公開 callback が次状態と操作詳細を通知することを確認する。
      await userEvent.keyboard(' ');
      await expect(toggle).toHaveFocus();
      await expect(toggle).toHaveAttribute(pressedAttribute, 'false');
      await expect(args.onPressedChange).toHaveBeenCalledTimes(1);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(false, expect.anything());
    });

    await step('クリックで押下状態へ戻り focus を維持する', async () => {
      // pointer 操作でも同じ二状態契約へ戻り、keyboard と異なるイベント経路で状態が分岐しないことを確認する。
      await userEvent.click(toggle);
      await expect(toggle).toHaveFocus();
      await expect(toggle).toHaveAttribute(pressedAttribute, 'true');
      await expect(args.onPressedChange).toHaveBeenCalledTimes(2);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(true, expect.anything());
    });
  },
};

/**
 * 公式 Outline 例と同じ Italic・Bold の二つを、icon と可視テキスト付きで表示する。
 * どちらも独立した二状態ボタンとして名前と未押下状態を持ち、クリック対象だけを切り替える。
 */
export const Outline: Story = {
  render: () => (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <Toggle aria-label="Toggle italic" variant="outline">
        <ItalicIcon aria-hidden />
        Italic
      </Toggle>
      <Toggle aria-label="Toggle bold" variant="outline">
        <BoldIcon aria-hidden />
        Bold
      </Toggle>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const italicToggle = canvas.getByRole('button', { name: 'Toggle italic' });
    const boldToggle = canvas.getByRole('button', { name: 'Toggle bold' });

    await step('二つの outline Toggle が名前と独立した未押下状態を持つ', async () => {
      // 可視テキストと一致する用途を aria-label で明確化し、両方の初期状態を ARIA から判定できるようにする。
      await expect(italicToggle).toHaveAccessibleName('Toggle italic');
      await expect(boldToggle).toHaveAccessibleName('Toggle bold');
      await expect(italicToggle).toHaveAttribute(pressedAttribute, 'false');
      await expect(boldToggle).toHaveAttribute(pressedAttribute, 'false');
    });

    await step('クリックした outline Toggle だけを押下済みにする', async () => {
      // Italic を pointer で選び、Bold の状態を保ったまま focus と状態が対象へ移ることを確認する。
      await userEvent.click(italicToggle);
      await expect(italicToggle).toHaveFocus();
      await expect(italicToggle).toHaveAttribute(pressedAttribute, 'true');
      await expect(boldToggle).toHaveAttribute(pressedAttribute, 'false');
    });
  },
};

/**
 * 公式 With Text 例と同じ Italic icon と可視ラベルを、既定 variant で表示する。
 * 装飾 icon を読み上げ対象から外し、button の操作名を一つに保つ。
 */
export const WithText: Story = {
  render: () => (
    <Toggle aria-label="Toggle italic">
      <ItalicIcon aria-hidden />
      Italic
    </Toggle>
  ),
  play: async ({ canvasElement }) => {
    // role と公式操作名から icon・text 構成を取得し、可視要素数や DOM 順序へ test を依存させない。
    const toggle = within(canvasElement).getByRole('button', { name: 'Toggle italic' });
    await expect(toggle).toHaveAccessibleName('Toggle italic');
    await expect(toggle).toHaveAttribute(pressedAttribute, 'false');
  },
};

/**
 * 公式 Sizes 例と同じ Small・Default・Large を outline variant で表示する。
 * 折り返し可能な配置により、390px viewport でも内容と操作名を削らず横 overflow を防ぐ。
 */
export const Sizes: Story = {
  render: () => (
    <div
      aria-label="Toggle sizes"
      className="flex max-w-full flex-wrap items-center gap-2"
      role="group"
    >
      <Toggle aria-label="Toggle small" size="sm" variant="outline">
        Small
      </Toggle>
      <Toggle aria-label="Toggle default" size="default" variant="outline">
        Default
      </Toggle>
      <Toggle aria-label="Toggle large" size="lg" variant="outline">
        Large
      </Toggle>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sizeGroup = canvas.getByRole('group', { name: 'Toggle sizes' });
    const sizeToggles = within(sizeGroup).getAllByRole('button');

    await step('三つの公式 size が固有名と未押下状態を持つ', async () => {
      // 表示順へ依存せず名前から各 size を取得し、すべてが同じ二状態 button 契約を公開することを確認する。
      for (const name of ['Toggle small', 'Toggle default', 'Toggle large']) {
        const toggle = within(sizeGroup).getByRole('button', { name });
        await expect(toggle).toHaveAccessibleName(name);
        await expect(toggle).toHaveAttribute(pressedAttribute, 'false');
      }
      await expect(sizeToggles).toHaveLength(3);
    });

    await step('390px を含む viewport 内で size 一覧を折り返す', async () => {
      // wrapper の実測幅を比較し、三つの可視ラベルが canvas 外へはみ出さないことを保証する。
      await expect(sizeGroup.scrollWidth).toBeLessThanOrEqual(sizeGroup.clientWidth);
    });
  },
};

/**
 * 公式 Disabled 例と同じ default・outline の二つを表示する。
 * native disabled semantics、名前、未押下状態を保ち、DOM click でも状態変更を通知しない。
 */
export const Disabled: Story = {
  args: {
    onPressedChange: fn(),
  },
  render: ({ onPressedChange }) => (
    <div
      aria-label="Disabled toggles"
      className="flex max-w-full flex-wrap items-center gap-2"
      role="group"
    >
      <Toggle aria-label="Toggle disabled" disabled onPressedChange={onPressedChange}>
        Disabled
      </Toggle>
      <Toggle
        aria-label="Toggle disabled outline"
        disabled
        onPressedChange={onPressedChange}
        variant="outline"
      >
        Disabled
      </Toggle>
    </div>
  ),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const defaultToggle = canvas.getByRole('button', { name: 'Toggle disabled' });
    const outlineToggle = canvas.getByRole('button', { name: 'Toggle disabled outline' });

    await step('default と outline が名前付きの無効な二状態ボタンである', async () => {
      // opacity の見た目だけでなく native disabled と明示的な未押下状態を両 variant で確認する。
      await expect(defaultToggle).toHaveAccessibleName('Toggle disabled');
      await expect(outlineToggle).toHaveAccessibleName('Toggle disabled outline');
      await expect(defaultToggle).toBeDisabled();
      await expect(outlineToggle).toBeDisabled();
      await expect(defaultToggle).toHaveAttribute(pressedAttribute, 'false');
      await expect(outlineToggle).toHaveAttribute(pressedAttribute, 'false');
    });

    await step('無効状態は DOM click でも押下状態と通知回数を変えない', async () => {
      // pointer-events を迂回する低水準 click を両方へ送り、primitive 自体が状態変更を拒否することを確認する。
      await fireEvent.click(defaultToggle);
      await fireEvent.click(outlineToggle);
      await expect(defaultToggle).toHaveAttribute(pressedAttribute, 'false');
      await expect(outlineToggle).toHaveAttribute(pressedAttribute, 'false');
      await expect(args.onPressedChange).not.toHaveBeenCalled();
    });
  },
};
