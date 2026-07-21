import { ArrowRightIcon, ImageIcon, InboxIcon } from 'lucide-react';
import { Fragment } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@cfreact-template/ui/components/item';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, MouseEvent } from 'react';

/** `Item` が公開する全 variant を固定比較 Story の単一データ源として保持する。 */
const variantOptions = ['default', 'outline', 'muted'] as const;

/** `Item` が公開する全 size を固定比較 Story の単一データ源として保持する。 */
const sizeOptions = ['default', 'sm', 'xs'] as const;

/** `ItemMedia` の全 variant と、media を省略できる構成を画像通信なしで比較する。 */
const mediaCases = [
  { id: 'default', label: 'default media', media: 'default' },
  { id: 'icon', label: 'icon media', media: 'icon' },
  { id: 'image', label: 'image media（画像資産なし）', media: 'image' },
  { id: 'none', label: 'media なし', media: 'none' },
] as const;

/** `Item` の既定水平配置と、公開 className で構成する垂直配置を同じ内容で比較する。 */
const orientationCases = [
  { id: 'horizontal', label: 'horizontal（既定）', className: undefined },
  { id: 'vertical', label: 'vertical（className 構成）', className: 'flex-col items-stretch' },
] as const;

/** `ItemGroup` と `ItemSeparator` の親子関係を固定順序で示す汎用項目。 */
const groupItems = [
  { id: 'first', title: '最初の項目', description: '一覧の先頭に置く固定内容です。' },
  { id: 'second', title: '次の項目', description: '区切りの後に置く固定内容です。' },
  { id: 'third', title: '最後の項目', description: '一覧の末尾に置く固定内容です。' },
] as const;

type ItemMediaVariant = NonNullable<ComponentProps<typeof ItemMedia>['variant']>;
type MediaKind = ItemMediaVariant | 'none';

/** 固定 Item 構成へ渡す公開 root props、表示内容、media、操作契約。 */
interface ItemPreviewProps {
  /** 見出しとの関連付けに使う Story 内で一意な固定識別子。 */
  id: string;
  /** `Item` root へそのまま渡す既存の公開 props。 */
  rootProps?: Omit<ComponentProps<typeof Item>, 'children' | 'render'>;
  /** `ItemTitle` に表示する固定見出し。 */
  title: string;
  /** `ItemDescription` に表示する固定説明。 */
  description: string;
  /** `ItemMedia` の既存 variant、または media を描画しない指定。 */
  media?: MediaKind;
  /** `ItemActions` 内へ表示する既存 Button の可視ラベル。 */
  actionLabel?: string;
  /** 操作通知を外部作用なしで観測する Story 専用ハンドラー。 */
  onAction?: ComponentProps<typeof Button>['onClick'];
}

/** 全サブコンポーネント例の操作通知を外部作用なしで観測する spy。 */
const allSubcomponentsActionClick = fn();

/** anchor へ置き換えた `Item` のクリック通知を外部作用なしで観測する spy。 */
const interactiveItemClick = fn((event: MouseEvent<HTMLAnchorElement>) => {
  // fragment navigation による browser test document の再読込を防ぎ、クリック通知だけを観測する。
  event.preventDefault();
});

/** disabled button へ置き換えた `Item` が通知しないことを観測する spy。 */
const disabledItemClick = fn();

/**
 * 指定された media 構成を、外部画像通信や独自色なしで `ItemMedia` へ描画する。
 *
 * @param media `ItemMedia` の既存 variant、または media を省略する `none`。
 * @returns 指定 variant の media、または media-free 構成用の `null`。
 */
function MediaPreview({ media }: { media: MediaKind }) {
  if (media === 'none') {
    // media を持たないこと自体を利用可能な構成として示し、空の装飾要素を残さない。
    return null;
  }

  if (media === 'default') {
    return (
      <ItemMedia variant="default" aria-hidden="true">
        {/* 汎用 media は既存 muted token だけで表現し、製品固有の avatar や画像を作らない。 */}
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
          UI
        </span>
      </ItemMedia>
    );
  }

  if (media === 'image') {
    return (
      <ItemMedia variant="image" aria-hidden="true" className="bg-muted text-muted-foreground">
        {/* image variant の寸法と切り抜きだけを検証し、画像資産や data URL への依存を避ける。 */}
        <ImageIcon className="size-4" />
      </ItemMedia>
    );
  }

  // icon variant は component 自身の既定 icon 寸法へ委ね、追加の視覚 token を適用しない。
  return (
    <ItemMedia variant="icon" aria-hidden="true">
      <InboxIcon />
    </ItemMedia>
  );
}

/**
 * Media、Content、Title、Description と任意の Actions を一貫した固定構造で組み立てる。
 *
 * @param props root props、固定コピー、media 構成、任意の操作契約。
 * @returns 既存 Item API と token だけで構成した Story 専用の項目。
 */
function ItemPreview({
  id,
  rootProps,
  title,
  description,
  media = 'icon',
  actionLabel,
  onAction,
}: ItemPreviewProps) {
  // 固定 ID から見出し ID を生成し、div ベースの Item に一貫したアクセシブル名を与える。
  const titleId = `${id}-title`;

  return (
    <Item {...rootProps} aria-labelledby={titleId} role={rootProps?.role ?? 'group'}>
      <MediaPreview media={media} />
      <ItemContent>
        {/* div ベースの公開 API に heading semantics を補い、情報階層を支援技術へ伝える。 */}
        <ItemTitle id={titleId} role="heading" aria-level={3}>
          {title}
        </ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>

      {actionLabel === undefined ? null : (
        <ItemActions>
          {/* 可視ラベルを持つ既存 Button を使い、操作名とクリック対象を一致させる。 */}
          <Button type="button" size="sm" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </ItemActions>
      )}
    </Item>
  );
}

/**
 * `Item` と全公開サブコンポーネントを CSF3 の Docs・a11y・browser tests へ直接登録する。
 * 固定データと既存 token だけを使い、製品文脈や未定義の component props を追加しない。
 */
const meta = {
  title: 'Components/Item',
  component: Item,
  subcomponents: {
    ItemMedia,
    ItemContent,
    ItemTitle,
    ItemDescription,
    ItemActions,
    ItemHeader,
    ItemFooter,
    ItemGroup,
    ItemSeparator,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'media、content、title、description、actions、header、footer を組み合わせ、group と separator で関連項目をまとめる Item。全 variant・size・media variant、既定水平配置と className による垂直構成、render による操作可能・無効状態を固定例で確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Item>;

/** Storybook が Item catalog の Docs・accessibility・interaction tests を構築する既定 export。 */
export default meta;

/** metadata から全 Item Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * Header、Media、Content、Title、Description、Actions、Footer を一つの Item で網羅する。
 * play では見出しによる命名と可視操作の通知を利用者視点で検証する。
 */
export const AllSubcomponents: Story = {
  render: () => (
    <Item
      role="group"
      aria-labelledby="item-all-subcomponents-title"
      className="max-w-2xl"
      variant="outline"
    >
      <ItemHeader>
        {/* Header は項目全体の補助情報だけを保持し、主見出しより視覚的に弱い token を使う。 */}
        <span className="text-xs text-muted-foreground">ヘッダー</span>
        <span className="text-xs text-muted-foreground">固定状態</span>
      </ItemHeader>

      <ItemMedia variant="icon" aria-hidden="true">
        <InboxIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle id="item-all-subcomponents-title" role="heading" aria-level={2}>
          全領域を含む項目
        </ItemTitle>
        <ItemDescription>公開された情報領域と操作領域を同じ項目内で確認します。</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button type="button" size="sm" variant="outline" onClick={allSubcomponentsActionClick}>
          操作する
        </Button>
      </ItemActions>

      <ItemFooter>
        {/* Footer も既存 muted foreground を使用し、主内容や操作より強く見せない。 */}
        <span className="text-xs text-muted-foreground">フッター</span>
        <span className="text-xs text-muted-foreground">補足情報</span>
      </ItemFooter>
    </Item>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を除き、この Story の操作通知だけを検証する。
    allSubcomponentsActionClick.mockClear();

    // Story canvas 内に検索を限定し、Storybook 自体の操作要素を誤取得しない。
    const canvas = within(canvasElement);
    const item = canvas.getByRole('group', { name: '全領域を含む項目' });
    const action = canvas.getByRole('button', { name: '操作する' });

    await step('見出しを Item のアクセシブル名として公開する', async () => {
      await expect(item).toHaveAccessibleName('全領域を含む項目');
      await expect(canvas.getByText('補足情報')).toBeVisible();
    });

    await step('可視操作を利用側のハンドラーへ一度だけ通知する', async () => {
      await userEvent.click(action);
      await expect(allSubcomponentsActionClick).toHaveBeenCalledTimes(1);
    });
  },
};

/** default、outline、muted の全 variant を同じ media・copy・size 条件で比較する。 */
export const Variants: Story = {
  render: () => (
    <ul className="flex w-full max-w-2xl flex-col gap-4" aria-label="Item の全 variant">
      {variantOptions.map((variant) => (
        <li key={variant} className="flex flex-col gap-2">
          {/* variant 名は比較 caption として Item の外へ置き、項目自体の情報構造を変えない。 */}
          <span className="text-xs text-muted-foreground">{variant}</span>
          <ItemPreview
            id={`item-variant-${variant}`}
            rootProps={{ variant }}
            title={`${variant} variant`}
            description="外観以外の条件を固定した比較項目です。"
          />
        </li>
      ))}
    </ul>
  ),
};

/** default、sm、xs の全 size を同じ outline variant と固定内容で比較する。 */
export const Sizes: Story = {
  render: () => (
    <ul className="flex w-full max-w-2xl flex-col gap-4" aria-label="Item の全 size">
      {sizeOptions.map((size) => (
        <li key={size} className="flex flex-col gap-2">
          {/* size 名を外側の caption に保ち、Title と Description は同じ情報量で比較する。 */}
          <span className="text-xs text-muted-foreground">{size}</span>
          <ItemPreview
            id={`item-size-${size}`}
            rootProps={{ size, variant: 'outline' }}
            title={`${size} size`}
            description="余白、間隔、media 寸法を固定内容で比較します。"
          />
        </li>
      ))}
    </ul>
  ),
};

/**
 * Item の既定水平配置と、公開 className だけで組み立てる垂直配置を同じ内容で比較する。
 * 専用 orientation prop が存在するように見せず、caption で構成方法を明示する。
 */
export const Orientations: Story = {
  render: () => (
    <ul className="flex w-full max-w-2xl flex-col gap-6" aria-label="Item の配置方向">
      {orientationCases.map((orientation) => (
        <li key={orientation.id} className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">{orientation.label}</span>
          <ItemPreview
            id={`item-orientation-${orientation.id}`}
            rootProps={{ className: orientation.className, variant: 'outline' }}
            title="配置方向を比較する項目"
            description="同じ情報と操作を水平または垂直に配置します。"
            actionLabel="操作"
          />
        </li>
      ))}
    </ul>
  ),
};

/** `ItemMedia` の default・icon・image と、media-free 構成を外部画像なしで比較する。 */
export const MediaRepresentations: Story = {
  render: () => (
    <ul className="flex w-full max-w-2xl flex-col gap-4" aria-label="Item の media 構成">
      {mediaCases.map(({ id, label, media }) => (
        <li key={id} className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <ItemPreview
            id={`item-media-${id}`}
            rootProps={{ variant: 'outline' }}
            title={`${label} の項目`}
            description="画像通信や製品固有の素材を使わない固定表現です。"
            media={media}
          />
        </li>
      ))}
    </ul>
  ),
};

/**
 * `ItemGroup` 内に固定項目を置き、項目間の `ItemSeparator` を装飾的な区切りとして示す。
 */
export const GroupAndSeparator: Story = {
  render: () => (
    <ItemGroup className="max-w-2xl" aria-label="関連項目一覧">
      {groupItems.map(({ id, title, description }, index) => (
        <Fragment key={id}>
          {/* ItemGroup の list semantics に合わせ、各 Item を明示的な listitem として公開する。 */}
          <ItemPreview
            id={`item-group-${id}`}
            rootProps={{ role: 'listitem', size: 'sm', variant: 'outline' }}
            title={title}
            description={description}
            media="none"
          />

          {index === groupItems.length - 1 ? null : (
            // 既存 separator の role と orientation 属性を矛盾させず、反復する区切りだけを読み上げ対象から外す。
            <ItemSeparator aria-hidden="true" />
          )}
        </Fragment>
      ))}
    </ItemGroup>
  ),
};

/** `ItemSeparator` が受け付ける水平・垂直 orientation を既存の親配置だけで比較する。 */
export const SeparatorOrientations: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section aria-labelledby="item-separator-horizontal-label" className="flex flex-col gap-2">
        <span id="item-separator-horizontal-label" className="text-xs text-muted-foreground">
          horizontal
        </span>
        <ItemSeparator aria-label="水平の区切り" orientation="horizontal" />
      </section>

      <section
        aria-labelledby="item-separator-vertical-label"
        className="flex h-12 items-stretch gap-4"
      >
        <span id="item-separator-vertical-label" className="text-xs text-muted-foreground">
          vertical
        </span>
        {/* 垂直方向では親の固定高へ self-stretch させ、既定の縦 margin だけを既存 spacing で除く。 */}
        <ItemSeparator aria-label="垂直の区切り" orientation="vertical" className="my-0" />
        <span className="text-sm">区切り後の固定内容</span>
      </section>
    </div>
  ),
};

/**
 * `render` で anchor と disabled button を構成し、操作可能・無効の native semantics を比較する。
 * play ではローカルリンクの通知と disabled button の通知抑止を個別に保証する。
 */
export const InteractiveRenderStates: Story = {
  render: () => (
    <div id="item-render-target" className="flex w-full max-w-2xl flex-col gap-4">
      <Item
        aria-label="操作可能な項目"
        variant="outline"
        render={<a href="#item-render-target" onClick={interactiveItemClick} />}
      >
        <ItemMedia variant="icon" aria-hidden="true">
          <InboxIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>操作可能な項目</ItemTitle>
          <ItemDescription>render によりローカルリンクとして公開します。</ItemDescription>
        </ItemContent>
        <ItemActions aria-hidden="true">
          <ArrowRightIcon className="size-4" />
        </ItemActions>
      </Item>

      <Item
        aria-label="無効な項目"
        variant="muted"
        render={<button type="button" disabled onClick={disabledItemClick} />}
      >
        <ItemMedia variant="icon" aria-hidden="true">
          <InboxIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>無効な項目</ItemTitle>
          <ItemDescription>native button の disabled semantics を保持します。</ItemDescription>
        </ItemContent>
        <ItemActions aria-hidden="true">
          <ArrowRightIcon className="size-4" />
        </ItemActions>
      </Item>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を消去し、この Story で発生した通知だけを対象にする。
    interactiveItemClick.mockClear();
    disabledItemClick.mockClear();

    // role とアクセシブル名で render 後の native element を取得し、DOM 要素の置換契約を検証する。
    const canvas = within(canvasElement);
    const interactiveItem = canvas.getByRole('link', { name: '操作可能な項目' });
    const disabledItem = canvas.getByRole('button', { name: '無効な項目' });

    await step('render 後も link と disabled button の意味を保持する', async () => {
      await expect(interactiveItem).toHaveAttribute('href', '#item-render-target');
      await expect(disabledItem).toBeDisabled();
    });

    await step('操作可能な項目だけがクリックを通知する', async () => {
      await userEvent.click(interactiveItem);
      await expect(interactiveItemClick).toHaveBeenCalledTimes(1);

      // userEvent で実利用と同じ操作を送り、disabled button がイベントを発火しないことを保証する。
      await userEvent.click(disabledItem);
      await expect(disabledItemClick).not.toHaveBeenCalled();
    });
  },
};
