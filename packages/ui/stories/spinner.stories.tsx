import { expect, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Spinner } from '@cfreact-template/ui/components/spinner';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** インラインの status が可視表示と読み上げで共有する、製品文脈を持たない固定文言。 */
const INLINE_LOADING_LABEL = '読み込み中';

/** loading 中のボタンが可視表示とアクセシブルネームで共有する固定文言。 */
const BUTTON_LOADING_LABEL = '処理中';

/** 寸法比較の一覧を支援技術から識別する固定名。 */
const SIZE_LIST_LABEL = 'Spinner の寸法';

/**
 * `className` だけで表す Spinner の固定寸法見本。
 *
 * 独自の size prop は追加せず、既定寸法の継承と既存 Tailwind utility による上書きを同じ一覧で扱う。
 */
interface SpinnerSizeFixture {
  /** assertion と React key の双方で見本を安定して識別する固定 ID。 */
  id: string;
  /** 寸法の違いを色だけに依存せず説明する可視ラベル。 */
  label: string;
  /** 公開 `className` へ渡す寸法と reduced-motion 対応の既存 utility。 */
  className: string;
  /** `cn` の競合解決後に DOM へ残ることを期待する寸法 utility。 */
  expectedSizeClass: string;
  /** Storybook の既定 root font size から算出される固定表示寸法。 */
  expectedPixelSize: string;
}

/** 小・既定・大の三条件だけを比較し、製品固有の寸法体系を追加しない固定見本。 */
const SPINNER_SIZE_FIXTURES = [
  {
    id: 'small',
    label: '小',
    className: 'size-3 motion-reduce:animate-none',
    expectedSizeClass: 'size-3',
    expectedPixelSize: '12px',
  },
  {
    id: 'default',
    label: '既定',
    className: 'motion-reduce:animate-none',
    expectedSizeClass: 'size-4',
    expectedPixelSize: '16px',
  },
  {
    id: 'large',
    label: '大',
    className: 'size-6 motion-reduce:animate-none',
    expectedSizeClass: 'size-6',
    expectedPixelSize: '24px',
  },
] as const satisfies readonly SpinnerSizeFixture[];

/**
 * Spinner primitive の DOM、回転、reduced-motion、未確定 loading 契約を検証する。
 *
 * @param spinner Story 内から取得した Spinner の SVG 要素。
 * @returns DOM と class と ARIA の assertion がすべて完了した時点で解決する Promise。
 * @throws SVG、data slot、回転 class、または未確定 loading 契約が欠けた場合に Story test が失敗する。
 *
 * @example
 * ```ts
 * await assertSpinnerPrimitive(canvasElement.querySelector('[data-slot="spinner"]'));
 * ```
 */
async function assertSpinnerPrimitive(spinner: Element): Promise<void> {
  // 公開 data slot と Lucide の SVG 出力を確認し、別要素による見かけだけの代替を防ぐ。
  await expect(spinner.tagName.toLowerCase()).toBe('svg');
  await expect(spinner).toHaveAttribute('data-slot', 'spinner');
  await expect(spinner).toHaveAttribute('stroke', 'currentColor');

  // 通常時の回転と利用者設定による抑止を、既存 utility の組み合わせだけで提供する。
  await expect(spinner).toHaveClass('animate-spin', 'motion-reduce:animate-none');

  // Spinner は完了量を持たない status であり、progressbar の数値属性を作らないことを保証する。
  await expect(spinner).not.toHaveAttribute('aria-valuemin');
  await expect(spinner).not.toHaveAttribute('aria-valuemax');
  await expect(spinner).not.toHaveAttribute('aria-valuenow');
  await expect(spinner).not.toHaveAttribute('aria-valuetext');
}

/**
 * 可視文言を持つ composition 内で、Spinner が重複読み上げされない装飾要素であることを検証する。
 *
 * @param spinner インラインまたはボタン内に配置した Spinner の SVG 要素。
 * @returns primitive と装飾用 ARIA の assertion が完了した時点で解決する Promise。
 * @throws Spinner が accessibility tree へ独立した status や名前を公開した場合に Story test が失敗する。
 */
async function assertDecorativeSpinner(spinner: Element): Promise<void> {
  // 共通 primitive 契約を先に確認し、装飾化によって表示や reduced-motion 対応が失われていないことを保証する。
  await assertSpinnerPrimitive(spinner);

  // 親の可視文言だけを一度読み上げるため、公開 SVG props で既定 status と label を上書きする。
  await expect(spinner).toHaveAttribute('aria-hidden', 'true');
  await expect(spinner).toHaveAttribute('role', 'presentation');
  await expect(spinner).not.toHaveAttribute('aria-label');
}

/**
 * Spinner の全公開 export を、固定 composition と light・dark browser tests へ登録する metadata。
 *
 * 独自 variant や size prop は示さず、native SVG props と `className`、既存 semantic token だけを扱う。
 */
const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Spinner は完了量を持たない loading status です。既定寸法と className による寸法上書き、既定の status semantics、インライン・ボタン・単独表示を確認します。色は currentColor と既存 semantic token を継承し、回転は motion-reduce:animate-none で利用者の reduced-motion 設定に従います。進捗値は公開しません。',
      },
    },
  },
} satisfies Meta<typeof Spinner>;

/** Storybook が Spinner catalog の Docs、accessibility、browser tests を構築するための既定 export。 */
export default meta;

/** metadata から各 Spinner Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * Spinner 単独の既定 status semantics と、light・dark の background／foreground token 継承を示す。
 *
 * 既定の `Loading` label と `size-4` は変更せず、reduced-motion utility だけを公開 `className` で補う。
 */
export const Standalone: Story = {
  render: () => (
    <div
      data-testid="spinner-theme-surface"
      className="rounded-lg border border-border bg-background p-6 text-foreground"
    >
      {/* 単独表示では Spinner 自身が一つの名前付き status として loading 状態を通知する。 */}
      <Spinner className="motion-reduce:animate-none" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // Story canvas 内の semantic surface を基点にし、Storybook UI の status を assertion 対象から除く。
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('spinner-theme-surface');
    const spinner = within(surface).getByRole('status', { name: 'Loading' });

    await step('既定の単独 status と未確定 loading 契約を保つ', async () => {
      await assertSpinnerPrimitive(spinner);
      await expect(spinner).toHaveAttribute('role', 'status');
      await expect(spinner).toHaveAttribute('aria-label', 'Loading');
      await expect(spinner).toHaveClass('size-4');
      await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await step('light・dark の semantic token と currentColor を継承する', async () => {
      // hardcoded color を許容せず、surface と Spinner が同じ foreground token を解決することを確認する。
      await expect(surface).toHaveClass('border-border', 'bg-background', 'text-foreground');
      const surfaceStyle = window.getComputedStyle(surface);
      const spinnerStyle = window.getComputedStyle(spinner);

      // 両 theme project で foreground が背景と分離し、Spinner が親の現在色と一致することを保証する。
      await expect(surfaceStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      await expect(spinnerStyle.color).toBe(surfaceStyle.color);
      await expect(spinnerStyle.color).not.toBe(surfaceStyle.backgroundColor);
    });
  },
};

/**
 * 既定 `size-4` の継承と、公開 `className` による小・大の寸法上書きを同じ条件で比較する。
 *
 * 各 Spinner は可視ラベルが意味を伝える見本のため装飾扱いにし、複数 status の同時通知を避ける。
 */
export const Sizes: Story = {
  render: () => (
    <ul
      aria-label={SIZE_LIST_LABEL}
      className="flex flex-wrap items-end justify-center gap-x-8 gap-y-5"
    >
      {/* 固定 fixture を同じ構造で描画し、className 以外の比較条件を変えない。 */}
      {SPINNER_SIZE_FIXTURES.map(({ className, id, label }) => (
        <li key={id} className="flex min-w-16 flex-col items-center gap-3">
          {/* 可視ラベルが寸法名を伝えるため、個々の回転 SVG は accessibility tree から除外する。 */}
          <Spinner
            aria-hidden="true"
            aria-label={undefined}
            className={className}
            data-spinner-size={id}
            role="presentation"
          />
          <span className="text-xs text-muted-foreground">{label}</span>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    // 名前付き list に検索範囲を限定し、三つの固定寸法だけが表示されることを確認する。
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: SIZE_LIST_LABEL });
    const spinners = list.querySelectorAll('[data-slot="spinner"]');
    await expect(spinners).toHaveLength(SPINNER_SIZE_FIXTURES.length);

    for (const fixture of SPINNER_SIZE_FIXTURES) {
      // 固定 ID で各 SVG を取得し、DOM の描画順に依存せず class と実寸を対応付ける。
      const spinner = list.querySelector(`[data-spinner-size="${fixture.id}"]`);
      await expect(spinner).toBeInTheDocument();
      if (spinner === null) {
        throw new Error(`Spinner の寸法見本 ${fixture.id} が見つかりません。`);
      }

      // 既定値または className 上書きが `cn` で解決され、幅と高さへ同じ寸法を適用することを保証する。
      await assertDecorativeSpinner(spinner);
      await expect(spinner).toHaveClass(fixture.expectedSizeClass);
      const spinnerStyle = window.getComputedStyle(spinner);
      await expect(spinnerStyle.width).toBe(fixture.expectedPixelSize);
      await expect(spinnerStyle.height).toBe(fixture.expectedPixelSize);
    }

    // 寸法比較は loading 状態を通知しないため、status や数値進捗を accessibility tree へ追加しない。
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument();
  },
};

/**
 * 文中の固定 loading label と小さな Spinner を一つの status にまとめるインライン構成を示す。
 *
 * 親 status が可視文言を通知し、Spinner は装飾扱いになるため同じ状態を二重に読み上げない。
 */
export const InlineContext: Story = {
  render: () => (
    <span
      aria-busy="true"
      className="inline-flex items-center gap-2 text-sm text-foreground"
      role="status"
    >
      {/* inline text の行高へ合わせた寸法だけを className で指定し、意味は親 status に集約する。 */}
      <Spinner
        aria-hidden="true"
        aria-label={undefined}
        className="size-3 motion-reduce:animate-none"
        role="presentation"
      />
      <span>{INLINE_LOADING_LABEL}</span>
    </span>
  ),
  play: async ({ canvasElement }) => {
    // 親 status と可視文言を取得し、Spinner 自身が二つ目の status にならないことを確認する。
    const canvas = within(canvasElement);
    const status = canvas.getByRole('status');
    const spinner = status.querySelector('[data-slot="spinner"]');
    await expect(spinner).toBeInTheDocument();
    if (spinner === null) {
      throw new Error('インライン構成の Spinner が見つかりません。');
    }

    // busy 状態、可視文言、装飾 Spinner を一つの読み上げ単位として維持する。
    await expect(status).toHaveAttribute('aria-busy', 'true');
    await expect(status).toHaveTextContent(INLINE_LOADING_LABEL);
    await expect(canvas.getAllByRole('status')).toHaveLength(1);
    await assertDecorativeSpinner(spinner);
    await expect(spinner).toHaveClass('size-3');
    await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument();
  },
};

/**
 * disabled かつ busy な既存 Button に Spinner と固定ラベルを配置する loading 構成を示す。
 *
 * Button の名前は可視文言から取得し、Spinner を装飾扱いにして操作名と loading 通知の重複を防ぐ。
 */
export const ButtonContext: Story = {
  render: () => (
    <Button aria-busy="true" disabled>
      {/* Button の既存 icon 配置へ従い、Spinner の既定寸法と親から継承する currentColor をそのまま使う。 */}
      <Spinner
        aria-hidden="true"
        aria-label={undefined}
        className="motion-reduce:animate-none"
        role="presentation"
      />
      {BUTTON_LOADING_LABEL}
    </Button>
  ),
  play: async ({ canvasElement }) => {
    // 可視ラベルをアクセシブルネームに持つ Button を取得し、disabled と busy を同時に検証する。
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: BUTTON_LOADING_LABEL });
    const spinner = button.querySelector('[data-slot="spinner"]');
    await expect(spinner).toBeInTheDocument();
    if (spinner === null) {
      throw new Error('Button 構成の Spinner が見つかりません。');
    }

    // 操作不可と処理中を Button 自身が伝え、子 Spinner は視覚的な補助だけを担うことを保証する。
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAccessibleName(BUTTON_LOADING_LABEL);
    await assertDecorativeSpinner(spinner);
    await expect(spinner).toHaveClass('size-4');
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument();
  },
};
