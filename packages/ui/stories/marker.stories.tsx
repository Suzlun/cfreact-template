import { CheckIcon, InfoIcon } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { Marker, MarkerContent, MarkerIcon } from '@cfreact-template/ui/components/marker';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** `Marker` が公開する必須化済みの variant 値。 */
type MarkerVariant = NonNullable<ComponentProps<typeof Marker>['variant']>;

/** 全 variant を固定の中立ラベルと同じ条件で比較するための入力。 */
interface MarkerVariantFixture {
  /** Story 上で variant を識別する、製品文脈を持たない可視ラベル。 */
  label: string;
  /** `Marker` へそのまま渡す既存の variant。 */
  variant: MarkerVariant;
}

/** 全 variant と可視ラベルを、コンポーネントの定義順で管理する固定一覧。 */
const MARKER_VARIANT_FIXTURES = [
  { label: '既定', variant: 'default' },
  { label: '区切り線', variant: 'separator' },
  { label: '下線', variant: 'border' },
] as const satisfies readonly MarkerVariantFixture[];

/** Controls の選択肢を比較一覧と同じデータから導出し、variant の列挙順を一致させる。 */
const MARKER_VARIANTS = MARKER_VARIANT_FIXTURES.map(({ variant }) => variant);

/** Controls 例で表示内容とアクセシブルネームを一致させる固定テキスト。 */
const CONTROL_CONTENT = '固定テキスト';

/** 内容構成の比較一覧を支援技術から一つの list として取得するための固定名。 */
const CONTENT_GROUP_LABEL = 'Marker の内容構成一覧';

/** status 表現が可視内容と同じ状態を伝えるための固定名。 */
const STATUS_NAME = '状態: 完了';

/** icon-only 表現が icon の形状だけに依存せず意味を伝えるための固定名。 */
const ICON_ONLY_NAME = '確認済み';

/** text 表現の可視内容とアクセシブルネームに共用する固定テキスト。 */
const TEXT_CONTENT = 'テキストのみのマーカー';

/**
 * `Marker` と全 subcomponent を既存 API・token のまま登録する CSF3 metadata。
 * Controls は variant に限定し、表示内容と意味論は再現可能な固定値として維持する。
 */
const meta = {
  title: 'Components/Marker',
  component: Marker,
  subcomponents: {
    MarkerIcon,
    MarkerContent,
  },
  args: {
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      description: 'Marker が公開する既存の視覚的 variant。',
      options: MARKER_VARIANTS,
    },
  },
  parameters: {
    layout: 'padded',
    controls: {
      include: ['variant'],
    },
    docs: {
      description: {
        component:
          '全 variant、MarkerIcon と MarkerContent の構成、status・icon-only・text のアクセシブルな意味論を確認します。',
      },
    },
  },
  render: ({ variant }) => (
    <div className="mx-auto w-full max-w-xl">
      {/* 可視テキストを note の名前にも使い、Controls 操作後も表示と読み上げ内容を一致させる。 */}
      <Marker aria-labelledby="marker-controls-content" role="note" variant={variant}>
        {/* 情報 icon は装飾に限定し、固定テキストとの重複読み上げを防ぐ。 */}
        <MarkerIcon>
          <InfoIcon />
        </MarkerIcon>
        {/* MarkerContent の既存折り返し規則を保ったまま、Controls 例の固定内容を表示する。 */}
        <MarkerContent id="marker-controls-content">{CONTROL_CONTENT}</MarkerContent>
      </Marker>
    </div>
  ),
} satisfies Meta<typeof Marker>;

/** Storybook が Marker の CSF3 metadata、Docs、Controls、browser tests を読み込むための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** Controls で全 variant を切り替え、Marker・MarkerIcon・MarkerContent の基本構成を確認する Story。 */
export const Controls: Story = {
  play: async ({ canvasElement, step }) => {
    // Story の描画範囲だけを検索し、可視内容と同じ名前を持つ note を取得する。
    const marker = within(canvasElement).getByRole('note', { name: CONTROL_CONTENT });

    await step('基本構成が固定テキストをアクセシブルな note として公開する', async () => {
      // Controls の初期 variant と、両 subcomponent の slot を DOM 契約として確認する。
      await expect(marker).toHaveAttribute('data-variant', 'default');
      await expect(marker.querySelector('[data-slot="marker-icon"]')).toBeInTheDocument();
      await expect(marker.querySelector('[data-slot="marker-content"]')).toHaveTextContent(
        CONTROL_CONTENT
      );
    });
  },
};

/** 全 variant を同じ icon・text で並べ、狭い画面では縦、広い画面では三列で比較する Story。 */
export const Variants: Story = {
  render: () => (
    <ul
      aria-label="Marker の variant 一覧"
      className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-3"
    >
      {MARKER_VARIANT_FIXTURES.map(({ label, variant }) => {
        // 各固定ラベルを見出しと Marker の名前で共有し、視覚表現だけに識別を依存させない。
        const headingId = `marker-variant-${variant}`;

        return (
          <li key={variant} className="min-w-0 space-y-3">
            <h2 id={headingId} className="text-sm font-medium text-foreground">
              {label}
            </h2>
            <Marker aria-labelledby={headingId} role="note" variant={variant}>
              {/* 全 variant で同じ装飾 icon を使用し、比較条件を variant だけに限定する。 */}
              <MarkerIcon>
                <InfoIcon />
              </MarkerIcon>
              {/* 同じ固定内容を使い、separator と border を含む配置差を直接比較できるようにする。 */}
              <MarkerContent>{CONTROL_CONTENT}</MarkerContent>
            </Marker>
          </li>
        );
      })}
    </ul>
  ),
  play: async ({ canvasElement, step }) => {
    // variant 一覧のアクセシブル名を基準に、各 Marker を固定ラベルで取得する。
    const canvas = within(canvasElement);

    await step('公開される全 variant を名前付き note として描画する', async () => {
      // 各比較例が期待する variant を一つずつ公開し、列挙漏れを検出する。
      for (const { label, variant } of MARKER_VARIANT_FIXTURES) {
        const marker = canvas.getByRole('note', { name: label });
        await expect(marker).toHaveAttribute('data-variant', variant);
      }
    });
  },
};

/** status・icon-only・text を、狭い画面では縦、広い画面では三列の意味的な list で比較する Story。 */
export const ContentPatterns: Story = {
  render: () => (
    <ul
      aria-label={CONTENT_GROUP_LABEL}
      className="mx-auto grid w-full max-w-4xl gap-6 sm:grid-cols-3"
    >
      <li className="min-w-0 space-y-3">
        <h2 className="text-sm font-medium text-foreground">ステータス</h2>
        {/* 可視状態と同じ値を status の名前へ含め、色や icon だけに状態伝達を依存させない。 */}
        <Marker aria-label={STATUS_NAME} role="status">
          <MarkerIcon>
            <CheckIcon />
          </MarkerIcon>
          <MarkerContent>完了</MarkerContent>
        </Marker>
      </li>

      <li className="min-w-0 space-y-3">
        <h2 className="text-sm font-medium text-foreground">アイコンのみ</h2>
        {/* 子 icon は装飾のまま保ち、親 Marker を名前付き img として一度だけ読み上げる。 */}
        <Marker aria-label={ICON_ONLY_NAME} className="w-fit" role="img">
          <MarkerIcon>
            <CheckIcon />
          </MarkerIcon>
        </Marker>
      </li>

      <li className="min-w-0 space-y-3">
        <h2 className="text-sm font-medium text-foreground">テキスト</h2>
        {/* 可視内容を note の名前へ直接関連付け、icon を持たない text 構成を明示する。 */}
        <Marker aria-labelledby="marker-text-content" role="note">
          <MarkerContent id="marker-text-content">{TEXT_CONTENT}</MarkerContent>
        </Marker>
      </li>
    </ul>
  ),
  play: async ({ canvasElement, step }) => {
    // 名前付き list 内へ検索範囲を限定し、三つの意味構造を役割と名前で取得する。
    const canvas = within(canvasElement);
    const group = canvas.getByRole('list', { name: CONTENT_GROUP_LABEL });
    const groupCanvas = within(group);
    const statusMarker = groupCanvas.getByRole('status', { name: STATUS_NAME });
    const iconOnlyMarker = groupCanvas.getByRole('img', { name: ICON_ONLY_NAME });
    const textMarker = groupCanvas.getByRole('note', { name: TEXT_CONTENT });

    await step('status・icon-only・text が明示的な役割と名前を公開する', async () => {
      // 各構成の名前を role query で解決できることにより、視覚だけに依存しないことを保証する。
      await expect(statusMarker).toBeVisible();
      await expect(iconOnlyMarker).toBeVisible();
      await expect(textMarker).toBeVisible();
    });

    await step('各内容構成が必要な subcomponent だけを持つ', async () => {
      // status は icon と content の両方を持ち、状態の意味と可視テキストを併記する。
      await expect(statusMarker.querySelector('[data-slot="marker-icon"]')).toBeInTheDocument();
      await expect(statusMarker.querySelector('[data-slot="marker-content"]')).toHaveTextContent(
        '完了'
      );

      // icon-only は MarkerIcon だけを持ち、名前は親 Marker の aria-label から提供する。
      await expect(iconOnlyMarker.querySelector('[data-slot="marker-icon"]')).toBeInTheDocument();
      await expect(
        iconOnlyMarker.querySelector('[data-slot="marker-content"]')
      ).not.toBeInTheDocument();

      // text は MarkerContent だけを持ち、装飾 icon を不要な読み上げ・表示から除外する。
      await expect(textMarker.querySelector('[data-slot="marker-icon"]')).not.toBeInTheDocument();
      await expect(textMarker.querySelector('[data-slot="marker-content"]')).toHaveTextContent(
        TEXT_CONTENT
      );
    });
  },
};
