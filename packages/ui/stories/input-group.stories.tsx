import {
  CopyIcon,
  CornerDownLeftIcon,
  FileCode2Icon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@cfreact-template/ui/components/input-group';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

/** ラベル付き InputGroup を各 Story で同じ情報構造に保つための固定プロパティ。 */
interface LabeledInputGroupProps {
  /** Label と入力コントロールを関連付ける Story 内で一意な固定 ID。 */
  controlId: string;
  /** InputGroup の公開構成だけで組み立てた入力コントロールと addon。 */
  children: ReactNode;
  /** 入力不可状態を Label と InputGroup の既存 data 属性へ同期する指定。 */
  disabled?: boolean;
  /** invalid 状態で入力コントロールから参照する固定エラー。 */
  error?: {
    /** `aria-describedby` と一致する Story 内で一意な固定 ID。 */
    id: string;
    /** 入力内容の修正方法を利用者へ伝える短い説明。 */
    message: string;
  };
  /** 可視ラベル兼、入力コントロールと InputGroup のアクセシブルネーム。 */
  label: string;
}

/** 検索構成のラベル、入力値、操作名を再現可能に保つ固定データ。 */
const searchCopy = {
  actionLabel: 'Search',
  controlId: 'input-group-search',
  label: 'Search',
  placeholder: 'Type to search...',
  typedValue: 'shadcn/ui',
} as const;

/** 通貨構成で金額入力と単位 addon を関連付ける固定データ。 */
const currencyCopy = {
  controlId: 'input-group-currency',
  currency: 'USD',
  label: 'Amount',
  placeholder: '0.00',
  symbol: '$',
} as const;

/** URL 構成でプロトコル、入力本体、末尾を分担する固定データ。 */
const urlCopy = {
  controlId: 'input-group-url',
  label: 'Website',
  placeholder: 'example.com',
  prefix: 'https://',
  suffix: '.com',
} as const;

/** icon-only action の対象 URL とアクセシブルネームを固定する表示データ。 */
const actionCopy = {
  actionLabel: 'Copy URL',
  controlId: 'input-group-action',
  label: 'Profile URL',
  value: 'https://x.com/shadcn',
} as const;

/** Textarea Story のファイル名、位置表示、操作名を固定する表示データ。 */
const textareaCopy = {
  controlId: 'input-group-textarea',
  copyLabel: 'Copy code',
  fileName: 'script.js',
  label: 'Code',
  position: 'Line 1, Column 1',
  refreshLabel: 'Reset code',
  runLabel: 'Run',
  value: "console.log('Hello, world!');",
} as const;

/** disabled Story で検索欄と操作ボタンの操作不可状態を比較する固定データ。 */
const disabledCopy = {
  actionLabel: 'Search',
  controlId: 'input-group-disabled',
  label: 'Disabled search',
  value: 'shadcn/ui',
} as const;

/** invalid Story の URL 値とアクセシブルなエラー関係を固定する表示データ。 */
const invalidCopy = {
  controlId: 'input-group-invalid',
  errorId: 'input-group-invalid-error',
  errorMessage: 'Enter a valid URL.',
  label: 'Website',
  prefix: 'https://',
  suffix: '.com',
  value: 'not a valid url',
} as const;

/** 一行入力の内部スクロールと親要素の横 overflow を確認する固定長 URL。 */
const longSingleLineValue =
  'organizations/shadcn-ui/repositories/input-group-component-documentation-and-examples';

/** Textarea の改行・連続文字列・折り返しを同時に確認する固定長文。 */
const longMultilineValue =
  'Document the behavior of the input group at narrow widths.\nABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** 長文 Story の addon が狭幅でも情報を失わず折り返すことを確認する固定補助文。 */
const longHelperText =
  '120 characters left. Long helper text wraps without widening the input group.';

/** 検索ボタンのクリック通知を Story 外の作用なしで観測する固定 spy。 */
const searchClick = fn();

/** URL コピーボタンのクリック通知を clipboard へ触れずに観測する固定 spy。 */
const copyClick = fn();

/**
 * Label、InputGroup、任意のエラーを既存 token だけで一貫して配置する。
 *
 * @param props 固定 ID、ラベル、公開 InputGroup 構成、disabled 状態、任意のエラー。
 * @returns 入力コントロールと group の双方を同じ可視ラベルへ関連付けた Story 用フォーム断片。
 */
function LabeledInputGroup({
  controlId,
  children,
  disabled = false,
  error,
  label,
}: LabeledInputGroupProps) {
  // group の名前と入力コントロールの可視ラベルを一つの要素から解決し、読み上げ内容を一致させる。
  const labelId = `${controlId}-label`;

  return (
    <div
      className="group grid w-full min-w-0 max-w-sm gap-2"
      data-disabled={disabled ? 'true' : undefined}
    >
      <Label id={labelId} htmlFor={controlId}>
        {label}
      </Label>

      {/* data-disabled は既存 InputGroup の disabled token と addon の状態表現だけを有効にする。 */}
      <InputGroup aria-labelledby={labelId} data-disabled={disabled ? 'true' : undefined}>
        {children}
      </InputGroup>

      {error === undefined ? null : (
        <p id={error.id} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

/**
 * InputGroup と全公開サブコンポーネントを CSF3 の Docs と interaction Story へ登録する。
 * 公式 shadcn/ui の馴染みある構成、既存 API、既存 token だけを使い、製品固有の概念を追加しない。
 */
const meta = {
  title: 'Forms/InputGroup',
  component: InputGroup,
  subcomponents: {
    InputGroupAddon,
    InputGroupButton,
    InputGroupText,
    InputGroupInput,
    InputGroupTextarea,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Search、currency、URL、inline action、Textarea、disabled、invalid、長文の応答表示を、InputGroup の公開 API で確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof InputGroup>;

/** Storybook が InputGroup catalog の Docs、描画、interaction tests を構築するための既定 export。 */
export default meta;

/** metadata から InputGroup Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式例に沿った検索、通貨、URL、文字付き操作、icon-only 操作を一つの Story で示す。
 * play では可視ラベル、入力、二種類の操作名、クリック通知を利用者視点で検証する。
 */
export const InlineAddons: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-6">
      <LabeledInputGroup controlId={searchCopy.controlId} label={searchCopy.label}>
        <InputGroupInput
          id={searchCopy.controlId}
          placeholder={searchCopy.placeholder}
          type="search"
        />

        {/* addon は control の後へ置き、align だけで検索 icon を入力先頭へ表示する。 */}
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>

        <InputGroupAddon align="inline-end">
          {/* 文字付き操作は公式例と同じ secondary variant を使い、可視文言を名前として公開する。 */}
          <InputGroupButton variant="secondary" onClick={searchClick}>
            {searchCopy.actionLabel}
          </InputGroupButton>
        </InputGroupAddon>
      </LabeledInputGroup>

      <LabeledInputGroup controlId={currencyCopy.controlId} label={currencyCopy.label}>
        <InputGroupInput
          id={currencyCopy.controlId}
          inputMode="decimal"
          placeholder={currencyCopy.placeholder}
          type="text"
        />

        {/* 通貨記号と単位は入力値へ混ぜず、読みやすい非操作 addon として両端へ配置する。 */}
        <InputGroupAddon align="inline-start">
          <InputGroupText>{currencyCopy.symbol}</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupText>{currencyCopy.currency}</InputGroupText>
        </InputGroupAddon>
      </LabeledInputGroup>

      <LabeledInputGroup controlId={urlCopy.controlId} label={urlCopy.label}>
        <InputGroupInput
          id={urlCopy.controlId}
          className="pl-0.5!"
          placeholder={urlCopy.placeholder}
          type="text"
        />

        {/* protocol と suffix は公式 Text 例の情報分担を保ち、入力本体だけを編集対象にする。 */}
        <InputGroupAddon align="inline-start">
          <InputGroupText>{urlCopy.prefix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupText>{urlCopy.suffix}</InputGroupText>
        </InputGroupAddon>
      </LabeledInputGroup>

      <LabeledInputGroup controlId={actionCopy.controlId} label={actionCopy.label}>
        <InputGroupInput
          id={actionCopy.controlId}
          defaultValue={actionCopy.value}
          readOnly
          type="url"
        />

        <InputGroupAddon align="inline-end">
          {/* icon-only 操作は可視文字を持たないため、目的を aria-label と title の双方で明示する。 */}
          <InputGroupButton
            aria-label={actionCopy.actionLabel}
            onClick={copyClick}
            size="icon-xs"
            title={actionCopy.actionLabel}
          >
            <CopyIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </LabeledInputGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を除き、この Story で発生したクリックだけを検証する。
    searchClick.mockClear();
    copyClick.mockClear();

    // Story の canvas 内をアクセシブル名で検索し、Storybook 自体の入力やボタンを誤取得しない。
    const canvas = within(canvasElement);
    const label = canvas.getByText(searchCopy.label, { selector: 'label' });
    const input = canvas.getByRole('searchbox', { name: searchCopy.label });
    const searchButton = canvas.getByRole('button', { name: searchCopy.actionLabel });
    const copyButton = canvas.getByRole('button', { name: actionCopy.actionLabel });

    await step('可視ラベルと二種類のボタン名を公開する', async () => {
      // Label の関連付けと計算済みアクセシブルネームを確認し、placeholder だけへの依存を防ぐ。
      await expect(label).toHaveAttribute('for', searchCopy.controlId);
      await expect(input).toHaveAccessibleName(searchCopy.label);
      await expect(searchButton).toHaveAccessibleName(searchCopy.actionLabel);
      await expect(copyButton).toHaveAccessibleName(actionCopy.actionLabel);
    });

    await step('ラベルから検索欄へ移動し、固定文字列を入力できる', async () => {
      // 利用者と同じラベル操作で focus を移し、キーボード入力が値へ完全に反映されることを保証する。
      await userEvent.click(label);
      await expect(input).toHaveFocus();
      await userEvent.type(input, searchCopy.typedValue);
      await expect(input).toHaveValue(searchCopy.typedValue);
    });

    await step('文字付き操作と icon-only 操作のクリックを個別に通知する', async () => {
      // 二つの公開 onClick が addon の focus 補助と混線せず、一度ずつ発火することを確認する。
      await userEvent.click(searchButton);
      await userEvent.click(copyButton);
      await expect(searchClick).toHaveBeenCalledTimes(1);
      await expect(copyClick).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * 公式コードエディタ例に沿って block-start と block-end addon を Textarea の上下へ配置する。
 * ファイル情報、icon-only 操作、位置情報、主要操作を既存 InputGroup API だけで表現する。
 */
export const Textarea: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <LabeledInputGroup controlId={textareaCopy.controlId} label={textareaCopy.label}>
        <InputGroupTextarea
          id={textareaCopy.controlId}
          className="min-h-[200px] font-mono"
          defaultValue={textareaCopy.value}
          spellCheck={false}
        />

        <InputGroupAddon align="block-end" className="border-t">
          <InputGroupText>{textareaCopy.position}</InputGroupText>
          <InputGroupButton className="ml-auto" size="sm" variant="default">
            {textareaCopy.runLabel}
            <CornerDownLeftIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>

        <InputGroupAddon align="block-start" className="border-b">
          <InputGroupText className="font-mono font-medium">
            <FileCode2Icon aria-hidden="true" />
            {textareaCopy.fileName}
          </InputGroupText>

          {/* icon-only 操作は同じ寸法と明示名を使い、視覚と読み上げの操作体系を一致させる。 */}
          <InputGroupButton
            aria-label={textareaCopy.refreshLabel}
            className="ml-auto"
            size="icon-xs"
            title={textareaCopy.refreshLabel}
          >
            <RefreshCwIcon aria-hidden="true" />
          </InputGroupButton>
          <InputGroupButton
            aria-label={textareaCopy.copyLabel}
            size="icon-xs"
            title={textareaCopy.copyLabel}
          >
            <CopyIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </LabeledInputGroup>
    </div>
  ),
};

/**
 * 公式検索構成を使い、InputGroupInput と InputGroupButton のネイティブ disabled 状態を示す。
 * 見た目だけでなく、入力欄と操作の双方が支援技術へ操作不可として公開される。
 */
export const Disabled: Story = {
  render: () => (
    <LabeledInputGroup controlId={disabledCopy.controlId} disabled label={disabledCopy.label}>
      <InputGroupInput
        id={disabledCopy.controlId}
        defaultValue={disabledCopy.value}
        disabled
        type="search"
      />

      <InputGroupAddon align="inline-start">
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton disabled variant="secondary">
          {disabledCopy.actionLabel}
        </InputGroupButton>
      </InputGroupAddon>
    </LabeledInputGroup>
  ),
  play: async ({ canvasElement }) => {
    // 可視ラベルから対象を取得し、見た目だけでなくネイティブの操作不可 semantics を確認する。
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('searchbox', { name: disabledCopy.label })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: disabledCopy.actionLabel })).toBeDisabled();
  },
};

/**
 * 公式 URL text 構成へ aria-invalid と可視エラーを加え、修正対象と説明の関係を示す。
 * 入力欄は `aria-describedby` で alert を参照し、色だけに依存せず invalid 状態を伝える。
 */
export const Invalid: Story = {
  render: () => (
    <LabeledInputGroup
      controlId={invalidCopy.controlId}
      error={{ id: invalidCopy.errorId, message: invalidCopy.errorMessage }}
      label={invalidCopy.label}
    >
      <InputGroupInput
        id={invalidCopy.controlId}
        aria-describedby={invalidCopy.errorId}
        aria-invalid="true"
        className="pl-0.5!"
        defaultValue={invalidCopy.value}
        type="text"
      />

      <InputGroupAddon align="inline-start">
        <InputGroupText>{invalidCopy.prefix}</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupText>{invalidCopy.suffix}</InputGroupText>
      </InputGroupAddon>
    </LabeledInputGroup>
  ),
  play: async ({ canvasElement }) => {
    // aria-invalid と説明参照の双方を確認し、色だけに依存しないエラー伝達を保証する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: invalidCopy.label });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(invalidCopy.errorMessage);
    await expect(canvas.getByRole('alert')).toHaveTextContent(invalidCopy.errorMessage);
  },
};

/**
 * URL と複数行の長文を可変幅コンテナで示し、狭幅でも親領域へはみ出さないことを確認する。
 * inline と block addon の既存余白を保ちながら、入力本体と補助文の overflow 契約を検証する。
 */
export const ResponsiveLongContent: Story = {
  render: () => (
    <div
      aria-label="Long input responsiveness"
      className="grid w-full min-w-0 max-w-xl gap-6"
      data-testid="input-group-long-content"
      role="group"
    >
      <LabeledInputGroup controlId="input-group-long-line" label="Repository URL">
        <InputGroupInput
          id="input-group-long-line"
          defaultValue={longSingleLineValue}
          type="text"
        />

        <InputGroupAddon align="inline-start" className="min-w-0">
          {/* 狭幅では protocol と host を省略表示し、Input 本体の操作領域を失わないようにする。 */}
          <InputGroupText className="max-w-20 truncate sm:max-w-40">
            https://github.com/
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupText>.git</InputGroupText>
        </InputGroupAddon>
      </LabeledInputGroup>

      <LabeledInputGroup controlId="input-group-long-textarea" label="Release notes">
        <InputGroupTextarea
          id="input-group-long-textarea"
          className="min-w-0"
          defaultValue={longMultilineValue}
          rows={5}
          wrap="soft"
        />

        <InputGroupAddon align="block-end" className="min-w-0">
          {/* addon 自体も入力幅を広げないよう、長い補助文を既存の文字寸法で明示的に折り返す。 */}
          <InputGroupText className="min-w-0 whitespace-normal break-all">
            {longHelperText}
          </InputGroupText>
        </InputGroupAddon>
      </LabeledInputGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // 名前付き group から各 InputGroup を取得し、addon を含む外枠の幅を個別に確認する。
    const canvas = within(canvasElement);
    const container = canvas.getByTestId('input-group-long-content');
    const inputGroup = canvas.getByRole('group', { name: 'Repository URL' });
    const textareaGroup = canvas.getByRole('group', { name: 'Release notes' });
    const textarea = canvas.getByRole('textbox', { name: 'Release notes' });

    // 一行 Input の内部スクロールは許容しつつ、外側の group と折り返す Textarea は横 overflow を発生させない。
    await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
    await expect(inputGroup.scrollWidth).toBeLessThanOrEqual(inputGroup.clientWidth);
    await expect(textareaGroup.scrollWidth).toBeLessThanOrEqual(textareaGroup.clientWidth);
    await expect(textarea.scrollWidth).toBeLessThanOrEqual(textarea.clientWidth);
    await expect(textarea).toHaveValue(longMultilineValue);
  },
};
