import { ArrowUpIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Badge } from '@cfreact-template/ui/components/badge';
import { Button } from '@cfreact-template/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@cfreact-template/ui/components/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from '@cfreact-template/ui/components/input-group';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@cfreact-template/ui/components/item';
import { Progress } from '@cfreact-template/ui/components/progress';
import { Spinner } from '@cfreact-template/ui/components/spinner';
import { cn } from '@cfreact-template/ui/lib/utils';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 公式 Button 例の variant、順序、可視 loading 文言を assertion と共有する。 */
const BUTTON_LOADING_LABELS = ['Loading...', 'Please wait', 'Processing'] as const;

/** 公式 Badge 例の variant、順序、可視 loading 文言を assertion と共有する。 */
const BADGE_LOADING_LABELS = ['Syncing', 'Updating', 'Processing'] as const;

/** 各composition内の公式Spinner要素をdata slotから取得する共通selector。 */
const spinnerSelector = '[data-slot="spinner"]';

/** 公式 Input Group 例の可視コピーと、非表示で補う入力名を一箇所へ集約する。 */
const inputCopy = {
  placeholder: 'Send a message...',
  inputLabel: 'Message to send',
  inputStatus: 'Sending message',
  textareaLabel: 'Message to validate',
  validating: 'Validating...',
  send: 'Send',
} as const;

/** 公式 Item 例の download 状態、進捗、回復操作を一箇所へ集約する。 */
const itemCopy = {
  title: 'Downloading...',
  description: '129 MB / 1000 MB',
  progressLabel: 'Download progress',
  cancel: 'Cancel',
} as const;

/** 公式 Empty 例の処理状態、説明、回復操作を一箇所へ集約する。 */
const emptyCopy = {
  title: 'Processing your request',
  description: 'Please wait while we process your request. Do not refresh the page.',
  cancel: 'Cancel',
} as const;

/** Input Group の Send 操作を Story 外の作用なしで観測する固定 spy。 */
const sendClick = fn();

/** Item の download cancellation を Story 外の作用なしで観測する固定 spy。 */
const cancelDownloadClick = fn();

/** Empty の request cancellation を Story 外の作用なしで観測する固定 spy。 */
const cancelRequestClick = fn();

/** Story 内で Spinner が受け取る公式 SVG props。 */
type SpinnerProps = ComponentProps<typeof Spinner>;

/**
 * 公式 Spinner の DOM と status semantics を保ち、利用者の reduced-motion 設定だけを全例へ適用する。
 *
 * @param props 公式 Spinner が公開する SVG props。`className` は reduced-motion utility と統合される。
 * @returns 通常時は回転し、reduced-motion 時は静止する公式 Spinner。
 * @throws 例外は送出しない。
 *
 * @example
 * ```tsx
 * <StorySpinner aria-busy="true" />
 * ```
 */
function StorySpinner({ className, ...props }: SpinnerProps) {
  // 見た目や公開 API は変えず、Story に存在する全回転へ同じ motion fallback を保証する。
  return <Spinner className={cn('motion-reduce:animate-none', className)} {...props} />;
}

/**
 * 可視 loading 文言を持つ composition で、Spinner の重複読み上げだけを抑止する。
 *
 * @param props 公式 Spinner が公開する SVG props。可視ラベルとの位置関係を示す data 属性も渡せる。
 * @returns 見た目と reduced-motion 対応を維持し、accessibility tree から除外した Spinner。
 * @throws 例外は送出しない。
 *
 * @example
 * ```tsx
 * <DecorativeSpinner data-icon="inline-start" />
 * ```
 */
function DecorativeSpinner({ className, ...props }: SpinnerProps) {
  // 親の可視文言または名前付き領域が状態を一度だけ伝えるため、既定 status を presentation へ上書きする。
  return (
    <StorySpinner
      {...props}
      aria-hidden="true"
      aria-label={undefined}
      className={className}
      role="presentation"
    />
  );
}

/**
 * 公式 Spinner の source 契約と reduced-motion fallback を検証する。
 *
 * @param spinner Story canvas から取得した Spinner の SVG 要素。
 * @returns DOM、currentColor、回転、reduced-motion の assertion 完了時に解決する Promise。
 * @throws 公式 source の要素、data slot、色、class が欠けた場合に Story test が失敗する。
 */
async function assertSpinnerSource(spinner: Element): Promise<void> {
  // 公式 registry と同じ SVG/currentColor を確認し、独自画像や別 primitive への置換を防ぐ。
  await expect(spinner.tagName.toLowerCase()).toBe('svg');
  await expect(spinner).toHaveAttribute('data-slot', 'spinner');
  await expect(spinner).toHaveAttribute('stroke', 'currentColor');
  await expect(spinner).toHaveClass('size-4', 'animate-spin', 'motion-reduce:animate-none');
}

/**
 * 独立して状態を伝える Spinner が、名前付きの未確定 status であることを検証する。
 *
 * @param spinner Story canvas から取得した Spinner の SVG 要素。
 * @param accessibleName 利用状況に対応する期待アクセシブルネーム。
 * @returns source と status semantics の assertion 完了時に解決する Promise。
 * @throws role、名前、または未確定進捗の契約が一致しない場合に Story test が失敗する。
 */
async function assertStatusSpinner(spinner: Element, accessibleName: string): Promise<void> {
  // primitive の見た目と motion 契約を先に検証し、その上で一つの名前付き status として扱う。
  await assertSpinnerSource(spinner);
  await expect(spinner).toHaveAttribute('role', 'status');
  await expect(spinner).toHaveAccessibleName(accessibleName);
  await expect(spinner).not.toHaveAttribute('aria-valuenow');
}

/**
 * 可視文言を持つ composition の Spinner が、重複する status を公開しないことを検証する。
 *
 * @param spinner Story canvas から取得した Spinner の SVG 要素。
 * @returns source と presentation semantics の assertion 完了時に解決する Promise。
 * @throws Spinner が accessibility tree に残る場合に Story test が失敗する。
 */
async function assertDecorativeSpinner(spinner: Element): Promise<void> {
  // 見た目と motion fallback は保持し、状態通知だけを親の可視文言へ集約する。
  await assertSpinnerSource(spinner);
  await expect(spinner).toHaveAttribute('aria-hidden', 'true');
  await expect(spinner).toHaveAttribute('role', 'presentation');
  await expect(spinner).not.toHaveAttribute('aria-label');
}

/**
 * Story の実用 composition が desktop と 390px の双方で横 overflow を作らないことを検証する。
 *
 * @param surface 各 Story の幅制約を担う最上位要素。
 * @returns scroll width が表示幅以内であることを確認した時点で解決する Promise。
 * @throws composition が viewport より横へ溢れた場合に Story test が失敗する。
 */
async function assertNoHorizontalOverflow(surface: HTMLElement): Promise<void> {
  // 実際の layout 寸法を比較し、文字列 class の存在だけで responsive 対応済みと判定しない。
  await expect(surface.scrollWidth).toBeLessThanOrEqual(surface.clientWidth);
}

/**
 * 公式 Spinner Docs の Basic、Button、Badge、Input Group、Item、Empty を実用 loading 状態として登録する。
 *
 * props matrix や独自 variant は追加せず、公式の component、variant、コピー、情報構造を保つ。
 * 既存 semantic token、light/dark projects、390px project、reduced-motion、ARIA の補強だけを適用する。
 */
const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Spinner Docs・Examples・new-york-v4 registry source に沿って、Basic、Button、Badge、Input Group、Item、Empty の loading 状態を確認します。可視構造は公式例を保ち、semantic token、390px、重複しない状態通知、reduced-motion fallback を補います。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Spinner>;

/** Storybook が Spinner catalog の Docs、accessibility、browser tests を構築する既定 export。 */
export default meta;

/** metadata から全 Spinner Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Usage と同じ単独 Spinner を、既定名を持つ未確定 loading status として示す。 */
export const Basic: Story = {
  render: () => (
    <div
      className="flex w-full items-center justify-center bg-background p-6 text-foreground"
      data-testid="basic-loading-surface"
    >
      {/* 単独表示では公式 Spinner 自身が loading 状態を通知し、可視文言を重ねない。 */}
      <StorySpinner aria-busy="true" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Storybook 管理 UI を除外し、Basic canvas 内の一つの status だけを取得する。
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('basic-loading-surface');
    const spinner = canvas.getByRole('status', { name: 'Loading' });

    // 公式の既定 status、reduced-motion、semantic surface、390px の収まりをまとめて確認する。
    await assertStatusSpinner(spinner, 'Loading');
    await expect(spinner).toHaveAttribute('aria-busy', 'true');
    await expect(surface).toHaveClass('bg-background', 'text-foreground');
    await assertNoHorizontalOverflow(surface);
  },
};

/** 公式 Button 例と同じ三つの disabled variant を、busy な操作として示す。 */
export const ButtonLoading: Story = {
  name: 'Button',
  render: () => (
    <div
      aria-label="Button loading states"
      className="mx-auto flex w-full flex-col items-center gap-4 bg-background text-foreground"
      data-testid="button-loading-surface"
      role="group"
    >
      <Button aria-busy="true" disabled size="sm">
        {/* 可視文言が操作名と状態を伝えるため、先頭 Spinner は装飾として扱う。 */}
        <DecorativeSpinner data-icon="inline-start" />
        {BUTTON_LOADING_LABELS[0]}
      </Button>
      <Button aria-busy="true" disabled size="sm" variant="outline">
        <DecorativeSpinner data-icon="inline-start" />
        {BUTTON_LOADING_LABELS[1]}
      </Button>
      <Button aria-busy="true" disabled size="sm" variant="secondary">
        <DecorativeSpinner data-icon="inline-start" />
        {BUTTON_LOADING_LABELS[2]}
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // 公式順序の三つの native button を可視名で取得し、variant の DOM 順へ依存しない説明を保つ。
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('button-loading-surface');
    const buttons = canvas.getAllByRole('button');
    await expect(buttons).toHaveLength(BUTTON_LOADING_LABELS.length);

    for (const [index, label] of BUTTON_LOADING_LABELS.entries()) {
      // 各 Button が操作不能かつ busy であり、子 Spinner を二つ目の status にしないことを確認する。
      const button = buttons.at(index);
      if (button === undefined) {
        throw new Error(`Button loading 例 ${label} が見つかりません。`);
      }
      const spinner = button.querySelector(spinnerSelector);
      if (spinner === null) {
        throw new Error(`Button loading 例 ${label} の Spinner が見つかりません。`);
      }

      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute('aria-busy', 'true');
      await expect(button).toHaveAccessibleName(label);
      await assertDecorativeSpinner(spinner);
      await expect(spinner).toHaveAttribute('data-icon', 'inline-start');
    }

    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    await assertNoHorizontalOverflow(surface);
  },
};

/** 公式 Badge 例と同じ三つの variant を、短い status label を持つ同期状態として示す。 */
export const BadgeLoading: Story = {
  name: 'Badge',
  render: () => (
    <div
      aria-label="Badge loading states"
      className="mx-auto flex w-full flex-wrap items-center justify-center gap-4 bg-background text-foreground [--radius:1.2rem]"
      data-testid="badge-loading-surface"
      role="group"
    >
      <Badge aria-busy="true" aria-label={BADGE_LOADING_LABELS[0]} role="status">
        {/* Badge 自身が可視文言を status として通知し、Spinner は装飾だけを担う。 */}
        <DecorativeSpinner data-icon="inline-start" />
        {BADGE_LOADING_LABELS[0]}
      </Badge>
      <Badge
        aria-busy="true"
        aria-label={BADGE_LOADING_LABELS[1]}
        role="status"
        variant="secondary"
      >
        <DecorativeSpinner data-icon="inline-start" />
        {BADGE_LOADING_LABELS[1]}
      </Badge>
      <Badge aria-busy="true" aria-label={BADGE_LOADING_LABELS[2]} role="status" variant="outline">
        <DecorativeSpinner data-icon="inline-start" />
        {BADGE_LOADING_LABELS[2]}
      </Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Badge root が公開する三つの status を取得し、Spinner の既定 status が混入していないことを確認する。
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('badge-loading-surface');
    const statuses = canvas.getAllByRole('status');
    await expect(statuses).toHaveLength(BADGE_LOADING_LABELS.length);

    for (const [index, label] of BADGE_LOADING_LABELS.entries()) {
      // 可視文言だけを名前として持つ busy status と、その中の装飾 Spinner を一対で検証する。
      const status = statuses.at(index);
      if (status === undefined) {
        throw new Error(`Badge loading 例 ${label} が見つかりません。`);
      }
      const spinner = status.querySelector(spinnerSelector);
      if (spinner === null) {
        throw new Error(`Badge loading 例 ${label} の Spinner が見つかりません。`);
      }

      await expect(status).toHaveAttribute('aria-busy', 'true');
      await expect(status).toHaveAccessibleName(label);
      await assertDecorativeSpinner(spinner);
    }

    await assertNoHorizontalOverflow(surface);
  },
};

/** 公式 Input Group 例と同じ disabled input、validation 文言、Send 操作を示す。 */
export const InputLoading: Story = {
  name: 'Input group',
  render: () => (
    <div
      className="mx-auto flex w-full max-w-md flex-col gap-4 bg-background text-foreground"
      data-testid="input-loading-surface"
    >
      <InputGroup aria-busy="true" aria-label="Sending a message">
        {/* placeholder だけへ依存せず入力名を補い、disabled と busy を同じ control group で伝える。 */}
        <InputGroupInput
          aria-label={inputCopy.inputLabel}
          disabled
          placeholder={inputCopy.placeholder}
        />
        <InputGroupAddon align="inline-end">
          {/* 可視文言がない一行例では、Spinner 自身が具体的な送信 status を通知する。 */}
          <StorySpinner aria-label={inputCopy.inputStatus} />
        </InputGroupAddon>
      </InputGroup>

      <InputGroup aria-busy="true" aria-label="Validating a message">
        <InputGroupTextarea
          aria-describedby="spinner-validation-status"
          aria-label={inputCopy.textareaLabel}
          disabled
          placeholder={inputCopy.placeholder}
        />
        <InputGroupAddon align="block-end">
          {/* 公式の可視 validation 文言を一つの live status とし、子 Spinner の重複通知を抑止する。 */}
          <span
            aria-label={inputCopy.validating}
            className="inline-flex items-center gap-2"
            id="spinner-validation-status"
            role="status"
          >
            <DecorativeSpinner />
            {inputCopy.validating}
          </span>
          {/* 公式の有効な Send 操作を保ち、390px では 44px の touch target を確保する。 */}
          <InputGroupButton
            className="ml-auto min-h-11 min-w-11 sm:min-h-6 sm:min-w-6"
            onClick={sendClick}
            variant="default"
          >
            <ArrowUpIcon aria-hidden="true" />
            <span className="sr-only">{inputCopy.send}</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // theme project や再実行の履歴を除き、現在の Send 操作だけを観測する。
    sendClick.mockClear();

    // 入力名、group 名、status 名から要素を取得し、placeholder や DOM 位置へ依存しない検証にする。
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('input-loading-surface');
    const sendingGroup = canvas.getByRole('group', { name: 'Sending a message' });
    const validatingGroup = canvas.getByRole('group', { name: 'Validating a message' });
    const input = canvas.getByRole('textbox', { name: inputCopy.inputLabel });
    const textarea = canvas.getByRole('textbox', { name: inputCopy.textareaLabel });
    const sendingStatus = canvas.getByRole('status', { name: inputCopy.inputStatus });
    const validatingStatus = canvas.getByRole('status', { name: inputCopy.validating });
    const send = canvas.getByRole('button', { name: inputCopy.send });

    // 二つの入力状態が disabled、busy、名前付き status を一貫して公開することを保証する。
    await expect(input).toBeDisabled();
    await expect(textarea).toBeDisabled();
    await expect(sendingGroup).toHaveAttribute('aria-busy', 'true');
    await expect(validatingGroup).toHaveAttribute('aria-busy', 'true');
    await assertStatusSpinner(sendingStatus, inputCopy.inputStatus);
    await expect(textarea).toHaveAccessibleDescription(inputCopy.validating);

    const validatingSpinner = validatingStatus.querySelector(spinnerSelector);
    if (validatingSpinner === null) {
      throw new Error('Input Group validation 例の Spinner が見つかりません。');
    }
    await assertDecorativeSpinner(validatingSpinner);

    // 有効な Send 操作が pointer 入力を一度だけ通知し、狭幅でも横 overflow を作らないことを確認する。
    await userEvent.click(send);
    await expect(sendClick).toHaveBeenCalledTimes(1);
    await assertNoHorizontalOverflow(surface);
  },
};

/** 公式 Item 例と同じ download 情報、Cancel、determinate progress を一つの busy region で示す。 */
export const ItemLoading: Story = {
  name: 'Item',
  render: () => (
    <div
      className="mx-auto flex w-full max-w-md flex-col gap-4 bg-background text-foreground [--radius:1rem]"
      data-testid="item-loading-surface"
    >
      <Item
        aria-busy="true"
        aria-describedby="spinner-download-description"
        aria-labelledby="spinner-download-title"
        role="region"
        variant="outline"
      >
        <ItemMedia aria-hidden="true" variant="icon">
          {/* region の見出しと busy state が意味を伝えるため、Spinner は visual indicator に限定する。 */}
          <DecorativeSpinner />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle aria-level={2} id="spinner-download-title" role="heading">
            {itemCopy.title}
          </ItemTitle>
          <ItemDescription id="spinner-download-description">
            {itemCopy.description}
          </ItemDescription>
        </ItemContent>
        {/* 公式の回復操作を保ち、390px では折り返して 44px の touch target を維持する。 */}
        <ItemActions className="basis-full justify-end sm:basis-auto">
          <Button
            className="min-h-11 sm:min-h-7"
            onClick={cancelDownloadClick}
            size="sm"
            type="button"
            variant="outline"
          >
            {itemCopy.cancel}
          </Button>
        </ItemActions>
        <ItemFooter>
          {/* Spinner の未確定 status と、公式の数値 progress を別 semantics として明確に区別する。 */}
          <Progress aria-label={itemCopy.progressLabel} value={75} />
        </ItemFooter>
      </Item>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // theme project や再実行の履歴を除き、現在の download cancellation だけを観測する。
    cancelDownloadClick.mockClear();

    // 名前付き region を起点にし、Item 内の busy、説明、進捗、回復操作を利用者視点で検証する。
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('item-loading-surface');
    const item = canvas.getByRole('region', { name: itemCopy.title });
    const progress = within(item).getByRole('progressbar', { name: itemCopy.progressLabel });
    const cancel = within(item).getByRole('button', { name: itemCopy.cancel });
    const spinner = item.querySelector(spinnerSelector);
    if (spinner === null) {
      throw new Error('Item loading 例の Spinner が見つかりません。');
    }

    // 未確定 Spinner は装飾へ集約し、数値進捗だけが determinate progressbar を公開する。
    await expect(item).toHaveAttribute('aria-busy', 'true');
    await expect(item).toHaveAccessibleDescription(itemCopy.description);
    await assertDecorativeSpinner(spinner);
    await expect(progress).toHaveAttribute('aria-valuenow', '75');

    // Cancel を一度実行でき、390px でも Item 全体が横へ溢れないことを保証する。
    await userEvent.click(cancel);
    await expect(cancelDownloadClick).toHaveBeenCalledTimes(1);
    await assertNoHorizontalOverflow(surface);
  },
};

/** 公式 Empty 例と同じ request processing copy と Cancel を、説明付きの busy region で示す。 */
export const EmptyLoading: Story = {
  name: 'Empty',
  render: () => (
    <Empty
      aria-busy="true"
      aria-describedby="spinner-request-description"
      aria-labelledby="spinner-request-title"
      className="mx-auto min-h-80 max-w-2xl bg-background text-foreground"
      data-testid="empty-loading-surface"
      role="region"
    >
      <EmptyHeader>
        <EmptyMedia aria-hidden="true" variant="icon">
          {/* region の見出しと busy state が意味を伝えるため、Spinner は visual indicator に限定する。 */}
          <DecorativeSpinner />
        </EmptyMedia>
        <EmptyTitle aria-level={2} id="spinner-request-title" role="heading">
          {emptyCopy.title}
        </EmptyTitle>
        <EmptyDescription id="spinner-request-description">
          {emptyCopy.description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {/* 公式の回復操作を保ち、390px では 44px の touch target を確保する。 */}
        <Button
          className="min-h-11 sm:min-h-7"
          onClick={cancelRequestClick}
          size="sm"
          type="button"
          variant="outline"
        >
          {emptyCopy.cancel}
        </Button>
      </EmptyContent>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    // theme project や再実行の履歴を除き、現在の request cancellation だけを観測する。
    cancelRequestClick.mockClear();

    // 見出しを名前に持つ region から、説明、busy、Cancel、装飾 Spinner の関係を検証する。
    const canvas = within(canvasElement);
    const empty = canvas.getByRole('region', { name: emptyCopy.title });
    const cancel = within(empty).getByRole('button', { name: emptyCopy.cancel });
    const spinner = empty.querySelector(spinnerSelector);
    if (spinner === null) {
      throw new Error('Empty loading 例の Spinner が見つかりません。');
    }

    // Empty 全体が一つの処理状態を伝え、子 Spinner が同じ状態を重複通知しないことを保証する。
    await expect(empty).toHaveAttribute('aria-busy', 'true');
    await expect(empty).toHaveAccessibleDescription(emptyCopy.description);
    await assertDecorativeSpinner(spinner);

    // Cancel を一度実行でき、390px でも Empty 自体が横 overflow を作らないことを確認する。
    await userEvent.click(cancel);
    await expect(cancelRequestClick).toHaveBeenCalledTimes(1);
    await assertNoHorizontalOverflow(empty);
  },
};
