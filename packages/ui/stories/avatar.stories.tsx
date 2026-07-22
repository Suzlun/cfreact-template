import { expect, within } from 'storybook/test';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@cfreact-template/ui/components/avatar';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** `Avatar` が公開する必須化済みの size 値。 */
type AvatarSize = NonNullable<ComponentProps<typeof Avatar>['size']>;

/** 公式の Avatar 構成と、画像・fallback に共通する人物名を描画するための入力。 */
interface OfficialAvatarProps {
  /** 画像を取得できない場合に表示する、公式例と同じ頭文字。 */
  initials: string;
  /** `AvatarImage` だけへ適用する、公式例由来の見た目調整。 */
  imageClassName?: string;
  /** 画像と fallback の双方へ引き継ぐ人物名。 */
  name: string;
  /** 公式例と同じ緑の状態 badge を表示するかどうか。 */
  online?: boolean;
  /** `Avatar` 公開 API が提供する寸法。省略時は `default` を使用する。 */
  size?: AvatarSize;
  /** shadcn/ui 公式例で公開されている画像 URL。省略時は fallback だけを表示する。 */
  source?: string;
}

/** 公式の AvatarGroup 構成へ追加人数を設定するための入力。 */
interface OfficialAvatarGroupProps {
  /** 公式例の `+3` を group 末尾へ表示するかどうか。 */
  withCount?: boolean;
}

/**
 * shadcn/ui 公式例の Avatar を、画像の読み込み成否に依存しない意味構造で描画する。
 *
 * @param props 公式画像 URL、頭文字、表示名、寸法、画像 class、オンライン状態。
 * @returns 公式画像、fallback、必要な場合は状態 badge を含む Avatar。
 * @remarks 公式 source の alt と fallback を保ち、現在表示される一方だけが同じ人物名を公開する。
 * @throws 例外は送出しない。画像取得に失敗した場合は Base UI が fallback へ切り替える。
 * @example
 * ```tsx
 * <OfficialAvatar
 *   source="https://github.com/shadcn.png"
 *   name="@shadcn"
 *   initials="CN"
 * />
 * ```
 */
function OfficialAvatar({
  initials,
  imageClassName,
  name,
  online = false,
  size,
  source,
}: OfficialAvatarProps) {
  // badge が示す状態を現在表示中の画像または fallback の名前へ統合し、色だけに依存させない。
  const accessibleName = online ? `${name}, online` : name;

  return (
    <Avatar size={size}>
      {/* 公式 source の alt を維持し、badge がある場合だけ同じ要素の読み上げ名へ状態を補足する。 */}
      {source === undefined ? null : (
        <AvatarImage
          src={source}
          alt={name}
          aria-label={accessibleName}
          className={imageClassName}
        />
      )}

      {/* 画像の代わりに描画される時だけ同じ人物名を公開し、頭文字の可視契約も維持する。 */}
      <AvatarFallback role="img" aria-label={accessibleName}>
        {initials}
      </AvatarFallback>

      {/* 公式例と同じ緑色 badge を、同じ位置と色 token で描画する。 */}
      {online ? <AvatarBadge className="bg-green-600 dark:bg-green-800" /> : null}
    </Avatar>
  );
}

/**
 * shadcn/ui 公式例と同じ三人を、同じ順序と grayscale 表現で AvatarGroup にまとめる。
 *
 * @param props 公式の追加人数を表示するかどうか。
 * @returns @shadcn、@maxleiter、@evilrabbit と、必要な場合は `+3` を含む group。
 * @remarks 人物、URL、alt、fallback、順序、grayscale、group count は公式 source と一致させる。
 * @throws 例外は送出しない。外部画像に失敗した場合も各 Avatar の fallback と意味構造を維持する。
 * @example
 * ```tsx
 * <OfficialAvatarGroup withCount />
 * ```
 */
function OfficialAvatarGroup({ withCount = false }: OfficialAvatarGroupProps) {
  return (
    <AvatarGroup className="grayscale">
      {/* 公式 group と同じ人物、URL、頭文字、順序を変更せず描画する。 */}
      <OfficialAvatar source="https://github.com/shadcn.png" name="@shadcn" initials="CN" />
      <OfficialAvatar source="https://github.com/maxleiter.png" name="@maxleiter" initials="LR" />
      <OfficialAvatar source="https://github.com/evilrabbit.png" name="@evilrabbit" initials="ER" />

      {/* 公式 source と同じ AvatarGroupCount と `+3` のテキストをそのまま公開する。 */}
      {withCount ? <AvatarGroupCount>+3</AvatarGroupCount> : null}
    </AvatarGroup>
  );
}

/**
 * shadcn/ui 公式ページ先頭の単体・badge・group count 構成をそのまま描画する。
 *
 * @returns 公式の余白、人物、画像 URL、grayscale、badge 色を持つ Avatar 構成。
 * @remarks Story 固有の見出しや比較表を追加せず、Avatar 自体の見た目と意味へ注意を限定する。
 * @throws 例外は送出しない。画像通信が未完了または失敗しても fallback が人物名を維持する。
 * @example
 * ```tsx
 * <OfficialAvatarComposition />
 * ```
 */
function OfficialAvatarComposition() {
  return (
    <div className="flex flex-row flex-wrap items-center gap-6 md:gap-12">
      {/* 公式先頭例と同じ grayscale の @shadcn Avatar。 */}
      <OfficialAvatar
        source="https://github.com/shadcn.png"
        name="@shadcn"
        initials="CN"
        imageClassName="grayscale"
      />

      {/* 公式先頭例と同じ緑の badge を持つ @evilrabbit Avatar。 */}
      <OfficialAvatar
        source="https://github.com/evilrabbit.png"
        name="@evilrabbit"
        initials="ER"
        online
      />

      {/* 公式先頭例と同じ三人と追加人数を持つ group。 */}
      <OfficialAvatarGroup withCount />
    </div>
  );
}

/**
 * Avatar の公式構成、fallback、badge、group、group count、全 size を Storybook へ登録する。
 *
 * Story の可視内容は固定し、画像ネットワークの状態ではなく公開 API と意味構造を比較できるようにする。
 */
const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  subcomponents: {
    AvatarImage,
    AvatarFallback,
    AvatarBadge,
    AvatarGroup,
    AvatarGroupCount,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式例の画像、fallback、状態 badge、group、group count、全 size を、画像読み込みに依存しないアクセシビリティ契約で確認します。',
      },
    },
    layout: 'centered',
  },
  render: OfficialAvatarComposition,
} satisfies Meta<typeof Avatar>;

/** Storybook が Avatar の Docs と browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** shadcn/ui 公式ページ先頭と同じ、単体・badge・group count をまとめた主要 Story。 */
export const Primary: Story = {
  play: async ({ canvasElement, step }) => {
    // Story の描画範囲だけを検索し、Storybook 管理 UI の要素を検証対象から除外する。
    const canvas = within(canvasElement);

    await step('公式 Primary と同じ可視構成を描画する', async () => {
      // 外部画像の読み込み順や内部 DOM 数ではなく、公式の追加人数表現だけを確認する。
      await expect(canvas.getByText('+3')).toBeVisible();
    });
  },
};

/** 画像を指定しない場合にも、fallback と人物名を決定的に確認できる Story。 */
export const Fallback: Story = {
  render: () => <OfficialAvatar name="@shadcn" initials="CN" />,
  play: async ({ canvasElement, step }) => {
    // 外部画像を一切描画しない Story で、fallback の可視性を決定的に検証する。
    const canvas = within(canvasElement);

    await step('画像なしでも fallback を表示する', async () => {
      // 画像を持たない公式構成では、頭文字 fallback が利用者へ公開されることだけを確認する。
      await expect(canvas.getByText('CN')).toBeVisible();
    });
  },
};

/** Base UI の公式 fallback 契約を、外部通信を起こさない画像失敗で確認する Story。 */
export const ImageFailureFallback: Story = {
  render: () => (
    <Avatar>
      {/* 通信を行わず失敗する URL を使い、公式 source と同じ alt 契約を維持する。 */}
      <AvatarImage src="about:invalid#storybook-avatar-image-failure" alt="@shadcn" />
      {/* 画像失敗後だけ同じ人物名と頭文字を公開し、親と子の img role 重複を避ける。 */}
      <AvatarFallback role="img" aria-label="@shadcn">
        CN
      </AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement, step }) => {
    // Story canvas だけを検索し、Storybook 管理 UI の要素を検証対象から除外する。
    const canvas = within(canvasElement);

    await step('画像取得に失敗すると fallback を表示する', async () => {
      // 外部画像の読み込み順や内部 img の存否を列挙せず、公開される fallback だけを確認する。
      await expect(await canvas.findByText('CN')).toBeVisible();
    });
  },
};

/** shadcn/ui 公式 Badge 例と同じ @shadcn、頭文字、緑の状態 badge を描画する Story。 */
export const Badge: Story = {
  render: () => (
    <OfficialAvatar source="https://github.com/shadcn.png" name="@shadcn" initials="CN" online />
  ),
};

/** shadcn/ui 公式 Avatar Group 例と同じ三人を描画する Story。 */
export const Group: Story = {
  render: () => <OfficialAvatarGroup />,
};

/** shadcn/ui 公式 Avatar Group Count 例と同じ三人と `+3` を描画する Story。 */
export const GroupCount: Story = {
  render: () => <OfficialAvatarGroup withCount />,
  play: async ({ canvasElement, step }) => {
    // Story canvas だけを検索し、Storybook 管理 UI の要素を検証対象から除外する。
    const canvas = within(canvasElement);

    await step('公式と同じ追加人数を表示する', async () => {
      // 内部 img の個数や DOM 順序ではなく、AvatarGroupCount の公開テキストだけを確認する。
      await expect(canvas.getByText('+3')).toBeVisible();
    });
  },
};

/** shadcn/ui 公式 Sizes 例と同じ順序と余白で、`sm`・`default`・`lg` を描画する Story。 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2 grayscale">
      {/* 公式ソースと同じ人物・画像・順序を使い、寸法以外の比較条件を固定する。 */}
      <OfficialAvatar
        source="https://github.com/shadcn.png"
        name="@shadcn"
        initials="CN"
        size="sm"
      />
      <OfficialAvatar source="https://github.com/shadcn.png" name="@shadcn" initials="CN" />
      <OfficialAvatar
        source="https://github.com/shadcn.png"
        name="@shadcn"
        initials="CN"
        size="lg"
      />
    </div>
  ),
};

/** fallback と緑の badge を一つの Avatar で確認し、状態カタログの表形式を増やさない Story。 */
export const States: Story = {
  name: 'Fallback with badge',
  render: () => <OfficialAvatar name="@shadcn" initials="CN" online />,
  play: async ({ canvasElement, step }) => {
    // 外部画像を持たない一つの Avatar だけで、fallback と badge の共存状態を決定的に検証する。
    const canvas = within(canvasElement);

    await step('fallback と badge を同時に表示する', async () => {
      // 内部 DOM の個数や属性を固定せず、利用者へ公開する頭文字だけを確認する。
      await expect(canvas.getByText('CN')).toBeVisible();
    });
  },
};
