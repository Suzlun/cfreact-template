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
import type { ComponentProps, ReactNode } from 'react';

/** Avatar の Story で利用する、製品文脈を持たない固定人物データ。 */
interface AvatarFixture {
  /** React の一覧描画で同一人物を安定して識別する固定 ID。 */
  id: string;
  /** Avatar のアクセシブルネームとして支援技術へ伝える表示名。 */
  name: string;
  /** 画像を表示できない場合に視覚的な識別を補助する固定の頭文字。 */
  initials: string;
}

/** Avatar が公開する必須化済みの size 値。 */
type AvatarSize = NonNullable<ComponentProps<typeof Avatar>['size']>;

/** 通常、group、group count の各 Story で共有する固定人物データ。 */
const AVATAR_FIXTURES = [
  { id: 'avatar-yamada', name: '山田 花子', initials: '山田' },
  { id: 'avatar-sato', name: '佐藤 健', initials: '佐藤' },
  { id: 'avatar-suzuki', name: '鈴木 葵', initials: '鈴木' },
] as const satisfies readonly AvatarFixture[];

/** 単体 Story の比較条件を揃えるために先頭の固定人物を参照する。 */
const PRIMARY_AVATAR = AVATAR_FIXTURES[0];

/** Avatar が公開する size と可視ラベルを、小さい順に対応付けた固定一覧。 */
const AVATAR_SIZE_FIXTURES = [
  { label: '小（sm）', size: 'sm' },
  { label: '標準（default）', size: 'default' },
  { label: '大（lg）', size: 'lg' },
] as const satisfies readonly { label: string; size: AvatarSize }[];

/** Controls の選択肢を比較用固定データと同じ順序から生成し、API 値のずれを防ぐ。 */
const AVATAR_SIZES = AVATAR_SIZE_FIXTURES.map(({ size }) => size);

/** group count が表す、画面上に Avatar を展開していない人数。 */
const ADDITIONAL_AVATAR_COUNT = 2;

/** AvatarGroup のまとまりを支援技術へ伝える固定名。 */
const AVATAR_GROUP_LABEL = '参加者';

/** AvatarGroupCount の可視表現を自然な日本語へ置き換えるアクセシブルネーム。 */
const AVATAR_GROUP_COUNT_LABEL = `ほか${String(ADDITIONAL_AVATAR_COUNT)}人`;

/**
 * HTTP 通信を起こさず AvatarImage の読み込み失敗だけを確定させる固定 URL。
 * `about:invalid` は画像資産も data URL も参照せず、ブラウザ内で失敗状態になる。
 */
const FAILED_IMAGE_SOURCE = 'about:invalid#storybook-avatar-image-failure';

/** fallback と badge を同じアクセシビリティ契約で描画するための入力。 */
interface FallbackAvatarProps {
  /** Avatar の表示名と頭文字を供給する固定人物データ。 */
  person: AvatarFixture;
  /** 既存 Avatar API の寸法。省略時はコンポーネント既定値を使用する。 */
  size?: AvatarSize;
  /** badge が示す状態。指定時は可視 badge と読み上げ名の両方へ反映する。 */
  status?: string;
}

/**
 * fallback を持つ Avatar を、重複読み上げのない `img` semantics で描画する。
 *
 * @param props - 固定人物データ、既存 size、任意の badge 状態。
 * @returns 頭文字 fallback と、必要な場合だけ状態 badge を含む Avatar。
 * @remarks 外部通信や状態変更は発生せず、status は可視 badge とアクセシブルネームを必ず同期する。
 * @example
 * ```tsx
 * <FallbackAvatar person={PRIMARY_AVATAR} status="オンライン" />
 * ```
 */
function FallbackAvatar({ person, size, status }: FallbackAvatarProps) {
  // badge がある場合は状態を人物名へ結合し、色だけに依存せず同じ意味を支援技術へ伝える。
  const accessibleName = status === undefined ? person.name : `${person.name}、${status}`;

  return (
    <Avatar role="img" aria-label={accessibleName} size={size}>
      {/* 親 Avatar が人物名を提供し、既存 foreground token で muted 背景との可読コントラストも確保する。 */}
      <AvatarFallback aria-hidden="true" className="text-foreground">
        {person.initials}
      </AvatarFallback>

      {status === undefined ? null : (
        // badge の意味は親 Avatar の読み上げ名へ含め、装飾的な点自体は支援技術から隠す。
        <AvatarBadge aria-hidden="true" />
      )}
    </Avatar>
  );
}

/** 画像失敗時の fallback を描画するための入力。 */
interface ImageFailureAvatarProps {
  /** Avatar の表示名と、失敗後に表示する頭文字を供給する固定人物データ。 */
  person: AvatarFixture;
  /** 既存 Avatar API の寸法。省略時はコンポーネント既定値を使用する。 */
  size?: AvatarSize;
}

/**
 * 外部画像へ接続せず、AvatarImage の失敗から fallback へ遷移する状態を描画する。
 *
 * @param props - 固定人物データと既存 size。
 * @returns 読み込みに失敗する AvatarImage と頭文字 fallback を含む Avatar。
 * @remarks `about:invalid` だけを使用するため、画像通信、data URL、状態更新処理は発生しない。
 * @example
 * ```tsx
 * <ImageFailureAvatar person={PRIMARY_AVATAR} />
 * ```
 */
function ImageFailureAvatar({ person, size }: ImageFailureAvatarProps) {
  return (
    <Avatar role="img" aria-label={person.name} size={size}>
      {/* 空の alt は失敗する子画像を装飾扱いにし、人物名を親 Avatar の一箇所だけで提供する。 */}
      <AvatarImage src={FAILED_IMAGE_SOURCE} alt="" />
      {/* 失敗後の頭文字は親と重複読み上げせず、既存 foreground token で可読コントラストを保つ。 */}
      <AvatarFallback aria-hidden="true" className="text-foreground">
        {person.initials}
      </AvatarFallback>
    </Avatar>
  );
}

/** サイズ・状態の比較一覧で、ラベルと Avatar を同じ順序へ揃えるための入力。 */
interface AvatarExampleItemProps {
  /** 比較対象の API 値または状態を説明する可視ラベル。 */
  label: string;
  /** ラベルの直後に配置する Avatar の固定例。 */
  children: ReactNode;
}

/**
 * サイズ・状態の比較対象を、意味のある list item と一貫した余白で描画する。
 *
 * @param props - 可視ラベルと、そのラベルが説明する Avatar。
 * @returns 縦方向にラベルと Avatar を並べた list item。
 * @remarks 既存 token の utility だけを使用し、外部入出力や状態変更は行わない。
 * @example
 * ```tsx
 * <AvatarExampleItem label="標準">
 *   <FallbackAvatar person={PRIMARY_AVATAR} />
 * </AvatarExampleItem>
 * ```
 */
function AvatarExampleItem({ label, children }: AvatarExampleItemProps) {
  return (
    <li className="flex min-w-24 flex-col items-center gap-2">
      {/* 比較条件を常に可視化し、色や寸法だけで状態を識別させない。 */}
      <span className="text-sm text-muted-foreground">{label}</span>
      {/* 呼び出し側が供給した Avatar をラベル直下の同じ基準位置へ配置する。 */}
      {children}
    </li>
  );
}

/**
 * Story の canvas 内で、人物 Avatar が `img` role と期待する名前を持つことを検証する。
 *
 * @param canvasElement - Story が描画された範囲。Storybook の管理 UI を検索対象から除外する。
 * @param accessibleName - Avatar に期待する人物名と、必要な場合は badge の状態名。
 * @returns semantics と可視性の検証が完了した時点で解決する Promise。
 * @throws 指定した名前の `img` role が存在しない、または非表示の場合に Story test が失敗する。
 * @example
 * ```ts
 * await assertNamedAvatar(canvasElement, '山田 花子');
 * ```
 */
async function assertNamedAvatar(
  canvasElement: HTMLElement,
  accessibleName: string
): Promise<void> {
  // Story の描画範囲だけを検索し、同名要素が Storybook UI にあっても誤取得しない。
  const canvas = within(canvasElement);

  // fallback の表示内容に依存せず、Avatar 自体の role とアクセシブルネームを検証する。
  await expect(canvas.getByRole('img', { name: accessibleName })).toBeVisible();
}

/**
 * Avatar と全サブコンポーネントを、既存 API・token のまま Storybook へ登録する CSF3 metadata。
 * Controls は size だけに限定し、人物データと状態は再現可能な固定値として各 Story が所有する。
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
  args: {
    size: 'default',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      description: '既存 Avatar API が提供する寸法。',
      options: AVATAR_SIZES,
    },
  },
  parameters: {
    layout: 'centered',
    controls: {
      include: ['size'],
    },
    docs: {
      description: {
        component:
          '画像なし・画像失敗時の fallback、状態 badge、group、group count、全 size の意味構造と表示を確認します。',
      },
    },
  },
  render: ({ size }) => <FallbackAvatar person={PRIMARY_AVATAR} size={size} />,
} satisfies Meta<typeof Avatar>;

/**
 * Storybook が Avatar の CSF3 metadata、Docs、Controls、browser tests を読み込むための既定 export。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 画像を指定しない Avatar が頭文字 fallback を表示し、人物名を `img` として公開する基本 Story。
 */
export const Fallback: Story = {
  play: async ({ canvasElement }) => {
    // fallback の可視内容ではなく、利用者へ必要な人物名が Avatar 自体にあることを保証する。
    await assertNamedAvatar(canvasElement, PRIMARY_AVATAR.name);
  },
};

/**
 * 通信を伴わない画像読み込み失敗後に fallback が表示され、人物名が維持される Story。
 */
export const ImageFailureFallback: Story = {
  render: ({ size }) => <ImageFailureAvatar person={PRIMARY_AVATAR} size={size} />,
  play: async ({ canvasElement }) => {
    // 画像が失敗しても親 Avatar の人物名が失われないことを先に検証する。
    await assertNamedAvatar(canvasElement, PRIMARY_AVATAR.name);

    // Base UI が失敗を確定した後に頭文字 fallback を描画するまで待機する。
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(PRIMARY_AVATAR.initials)).toBeVisible();
  },
};

/**
 * 状態 badge を持つ Avatar が、視覚的な点と同じ「オンライン」の意味を読み上げ名へ含める Story。
 */
export const Badge: Story = {
  args: {
    size: 'lg',
  },
  render: ({ size }) => <FallbackAvatar person={PRIMARY_AVATAR} size={size} status="オンライン" />,
  play: async ({ canvasElement }) => {
    // badge の色だけに依存せず、人物名とオンライン状態を一続きの名前として取得できることを保証する。
    await assertNamedAvatar(canvasElement, `${PRIMARY_AVATAR.name}、オンライン`);
  },
};

/**
 * 複数 Avatar を名前付き group としてまとめ、各人物を個別の `img` として識別できる Story。
 */
export const Group: Story = {
  render: ({ size }) => (
    <AvatarGroup role="group" aria-label={AVATAR_GROUP_LABEL}>
      {/* 固定人物を既存の重なり順で描画し、各 Avatar の人物名を保持する。 */}
      {AVATAR_FIXTURES.map((person) => (
        <FallbackAvatar key={person.id} person={person} size={size} />
      ))}
    </AvatarGroup>
  ),
  play: async ({ canvasElement }) => {
    // group 自体の目的を名前で取得し、単なる装飾的な重なりにしない。
    const group = within(canvasElement).getByRole('group', { name: AVATAR_GROUP_LABEL });
    const groupCanvas = within(group);

    // 各人物が group 内でも独立した `img` semantics と人物名を保つことを順番に検証する。
    for (const person of AVATAR_FIXTURES) {
      await expect(groupCanvas.getByRole('img', { name: person.name })).toBeVisible();
    }
  },
};

/**
 * AvatarGroupCount を含む group が、表示済み人物と追加人数をそれぞれ意味付きで公開する Story。
 */
export const GroupCount: Story = {
  render: ({ size }) => (
    <AvatarGroup role="group" aria-label={AVATAR_GROUP_LABEL}>
      {/* 表示済みの固定人物は group count と分離し、それぞれの人物名を維持する。 */}
      {AVATAR_FIXTURES.map((person) => (
        <FallbackAvatar key={person.id} person={person} size={size} />
      ))}
      {/* 追加人数は note と自然な日本語名で公開し、可視の省略表現をそのまま読み上げさせない。 */}
      <AvatarGroupCount
        role="note"
        aria-label={AVATAR_GROUP_COUNT_LABEL}
        className="text-foreground"
      >
        <span aria-hidden="true">+{ADDITIONAL_AVATAR_COUNT}</span>
      </AvatarGroupCount>
    </AvatarGroup>
  ),
  play: async ({ canvasElement }) => {
    // group と count の関係を canvas 内に限定して検証する。
    const group = within(canvasElement).getByRole('group', { name: AVATAR_GROUP_LABEL });
    const groupCanvas = within(group);

    // 省略表示された人数が記号列ではなく「ほか2人」という意味で取得できることを保証する。
    await expect(groupCanvas.getByRole('note', { name: AVATAR_GROUP_COUNT_LABEL })).toBeVisible();
  },
};

/**
 * `sm`・`default`・`lg` の全 size を同じ人物・fallback 条件で比較する Story。
 */
export const Sizes: Story = {
  render: () => (
    <ul aria-label="Avatar のサイズ一覧" className="flex flex-wrap items-end justify-center gap-6">
      {/* 固定順の全 size を同じ人物で描画し、寸法以外の比較条件を変えない。 */}
      {AVATAR_SIZE_FIXTURES.map(({ label, size }) => (
        <AvatarExampleItem key={size} label={label}>
          <FallbackAvatar person={PRIMARY_AVATAR} size={size} />
        </AvatarExampleItem>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    // 各 size が寸法にかかわらず同じ人物名と `img` semantics を保つことを保証する。
    const avatars = within(canvasElement).getAllByRole('img', { name: PRIMARY_AVATAR.name });
    await expect(avatars).toHaveLength(AVATAR_SIZES.length);
  },
};

/**
 * fallback、画像失敗 fallback、状態 badge の全状態を同じ寸法で比較する Story。
 */
export const States: Story = {
  render: ({ size }) => (
    <ul aria-label="Avatar の状態一覧" className="flex flex-wrap items-end justify-center gap-6">
      {/* 画像を持たない通常 fallback を、状態比較の基準として最初に配置する。 */}
      <AvatarExampleItem label="Fallback">
        <FallbackAvatar person={AVATAR_FIXTURES[0]} size={size} />
      </AvatarExampleItem>

      {/* 通信なしの画像失敗を再現し、失敗後の fallback 表示を隣接条件で比較する。 */}
      <AvatarExampleItem label="画像読み込み失敗">
        <ImageFailureAvatar person={AVATAR_FIXTURES[1]} size={size} />
      </AvatarExampleItem>

      {/* badge の可視状態とアクセシブルネームを、他状態と同じ寸法で比較する。 */}
      <AvatarExampleItem label="オンライン">
        <FallbackAvatar person={AVATAR_FIXTURES[2]} size={size} status="オンライン" />
      </AvatarExampleItem>
    </ul>
  ),
  play: async ({ canvasElement }) => {
    // 各状態が可視ラベルだけでなく、人物を識別できる `img` semantics を持つことを保証する。
    await assertNamedAvatar(canvasElement, AVATAR_FIXTURES[0].name);
    await assertNamedAvatar(canvasElement, AVATAR_FIXTURES[1].name);
    await assertNamedAvatar(canvasElement, `${AVATAR_FIXTURES[2].name}、オンライン`);
  },
};
