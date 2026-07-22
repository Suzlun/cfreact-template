import {
  BadgeCheckIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  PlusIcon,
  ShieldAlertIcon,
} from 'lucide-react';
import { Fragment } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Avatar, AvatarFallback, AvatarImage } from '@cfreact-template/ui/components/avatar';
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

/** shadcn/ui 公式 Item Docs と、このリポジトリの `base-nova` registry source URL。 */
const OFFICIAL_ITEM_URLS = {
  docs: 'https://ui.shadcn.com/docs/components/base/item',
  source: 'https://ui.shadcn.com/r/styles/base-nova/item.json',
} as const;

/** 公式 Avatar・Group 例の人物情報と画像 URL を、人物系 Story の単一データ源として保持する。 */
const people = [
  {
    username: 'shadcn',
    avatar: 'https://github.com/shadcn.png',
    email: 'shadcn@vercel.com',
    initials: 'CN',
  },
  {
    username: 'maxleiter',
    avatar: 'https://github.com/maxleiter.png',
    email: 'maxleiter@vercel.com',
    initials: 'LR',
  },
  {
    username: 'evilrabbit',
    avatar: 'https://github.com/evilrabbit.png',
    email: 'evilrabbit@vercel.com',
    initials: 'ER',
  },
] as const;

/** 公式 Image 例の楽曲情報を、画像付きリンク一覧へ同じ順序で適用する。 */
const music = [
  {
    title: 'Midnight City Lights',
    artist: 'Neon Dreams',
    album: 'Electric Nights',
    duration: '3:45',
  },
  {
    title: 'Coffee Shop Conversations',
    artist: 'The Morning Brew',
    album: 'Urban Stories',
    duration: '4:05',
  },
  {
    title: 'Digital Rain',
    artist: 'Cyber Symphony',
    album: 'Binary Beats',
    duration: '3:30',
  },
] as const;

/** 公式 Header 例の先頭モデル、画像 URL、クレジットを Header・Footer 構成へ適用する。 */
const featuredModel = {
  name: 'v0-1.5-sm',
  description: 'Everyday tasks and UI generation.',
  image:
    'https://images.unsplash.com/photo-1650804068570-7fb2e3dbf888?q=80&w=640&auto=format&fit=crop',
  credit: 'Valeria Reverdo on Unsplash',
} as const;

/** Basic Item の有効な Action 通知を、副作用なしで検証する Storybook spy。 */
const basicActionClick = fn();

/** Icon Item の Review 通知を、副作用なしで検証する Storybook spy。 */
const reviewActionClick = fn();

/** 公式 Docs link の遷移先を保ちつつ、interaction test 中の画面遷移だけを抑止する。 */
const documentationLinkClick = fn((event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
});

/** 人物 Avatar を、公式画像・fallback・通信状態に依存しないアクセシブルネームで描画する入力。 */
interface PersonAvatarProps {
  /** 390px では補助 Avatar を隠す場合など、公式構成に必要な既存 utility class。 */
  className?: string;
  /** 画像失敗時に表示する文字。省略時は公式 Avatar 例のイニシャルを使う。 */
  fallback?: string;
  /** 公式例に含まれる人物情報。 */
  person: (typeof people)[number];
  /** `Avatar` が公開する既存 size。省略時は `default` を使う。 */
  size?: ComponentProps<typeof Avatar>['size'];
}

/**
 * 公式人物画像を、画像取得の成否にかかわらず同じ名前を持つ Avatar として描画する。
 *
 * @param props 公式人物情報、fallback、既存 size、レスポンシブ表示 class。
 * @returns 公式 URL の画像と、通信失敗時の fallback を含む名前付き Avatar。
 * @remarks 画像と fallback の読み上げを親へ集約し、Light・Dark・通信状態で意味が変わらないようにする。
 * @throws 例外は送出しない。画像取得に失敗した場合は Base UI が fallback へ切り替える。
 * @example
 * ```tsx
 * <PersonAvatar person={people[2]} size="lg" />
 * ```
 */
function PersonAvatar({ className, fallback, person, size = 'default' }: PersonAvatarProps) {
  // 画像と fallback の双方を代表する名前を常在する Avatar ルートへ設定する。
  const accessibleName = `@${person.username}`;

  return (
    <Avatar role="img" aria-label={accessibleName} size={size} className={className}>
      {/* 画像 URL と grayscale は公式例を保ち、人物名は通信状態に依存しない親へ集約する。 */}
      <AvatarImage src={person.avatar} alt={accessibleName} className="grayscale" />
      <AvatarFallback aria-hidden="true" className="text-foreground">
        {fallback ?? person.initials}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * 公式 Avatar 例と同じ三人を重ね、390px では主対象だけを残して内容幅を確保する。
 *
 * @returns 公式 URL の三つの Avatar を含む、名前付きの人物グループ。
 * @remarks `sm` 未満で補助二人を隠す動作も公式 source と同じで、狭幅時のテキストと操作を圧迫しない。
 * @throws 例外は送出しない。各画像の失敗時はそれぞれの fallback を表示する。
 * @example
 * ```tsx
 * <TeamAvatarStack />
 * ```
 */
function TeamAvatarStack() {
  return (
    <div
      role="group"
      aria-label="Team members"
      className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background"
    >
      {/* 公式 source と同じレスポンシブ非表示で、390px の主要情報量を保つ。 */}
      <PersonAvatar person={people[0]} className="hidden sm:flex" />
      <PersonAvatar person={people[1]} className="hidden sm:flex" />
      <PersonAvatar person={people[2]} />
    </div>
  );
}

/**
 * `Item` と全公開サブコンポーネントを、公式 Docs の実用例とアクセシブルな状態へ登録する。
 * variant・size の比較表は作らず、各 API を Basic、Link、Action、Avatar、Image、Group、Header の用途で示す。
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
          'media、title、description、actions を持つ項目を構成し、group、separator、header、footer、render による link semantics を組み合わせる Item。shadcn/ui の base-nova 公式 Docs・Examples・registry source のコピーと画像 URL を、実用状態とアクセシビリティ契約で提示します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Item>;

/** Storybook が Item の Docs、アクセシビリティ、interaction tests を構築する既定 export。 */
export default meta;

/** metadata から全 Item Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式 Basic Item の情報構造と可視 Action を、そのまま一つの実用項目として提示する。
 * play では native button が Tab でフォーカスでき、Enter で一度だけ通知することを検証する。
 */
export const BasicItem: Story = {
  render: () => (
    <Item variant="outline" className="max-w-md">
      <ItemContent className="min-w-0">
        <ItemTitle>Basic Item</ItemTitle>
        <ItemDescription>A simple item with title and description.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button type="button" size="sm" variant="outline" onClick={basicActionClick}>
          Action
        </Button>
      </ItemActions>
    </Item>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を除き、この Story で発生した通知だけを検証する。
    basicActionClick.mockClear();

    // Story canvas 内へ検索を限定し、Storybook 管理 UI の操作要素を取得しない。
    const canvas = within(canvasElement);
    const action = canvas.getByRole('button', { name: 'Action' });

    await step('Action を有効な native button として公開する', async () => {
      await expect(action).toBeEnabled();
      await expect(action).toBeVisible();
    });

    await step('Tab と Enter で Action を一度だけ実行する', async () => {
      await userEvent.tab();
      await expect(action).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(basicActionClick).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * 公式 Link 例を、実在する Item Docs と `base-nova` registry source へのリンクとして提示する。
 * play では link の遷移契約、外部リンクの安全属性、Tab 順序、Enter 操作を検証する。
 */
export const Links: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Item render={<a href={OFFICIAL_ITEM_URLS.docs} onClick={documentationLinkClick} />}>
        <ItemContent className="min-w-0">
          <ItemTitle>Visit our documentation</ItemTitle>
          <ItemDescription>Learn how to get started with our components.</ItemDescription>
        </ItemContent>
        <ItemActions aria-hidden="true">
          <ChevronRightIcon />
        </ItemActions>
      </Item>

      <Item
        variant="outline"
        render={<a href={OFFICIAL_ITEM_URLS.source} target="_blank" rel="noopener noreferrer" />}
      >
        <ItemContent className="min-w-0">
          <ItemTitle>External resource</ItemTitle>
          <ItemDescription>Opens in a new tab with security attributes.</ItemDescription>
        </ItemContent>
        <ItemActions aria-hidden="true">
          <ExternalLinkIcon />
        </ItemActions>
      </Item>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を除き、この Story で発生した link 通知だけを検証する。
    documentationLinkClick.mockClear();

    // 可視コピーから link を取得し、追加 aria-label で公式の読み上げ内容を置き換えない。
    const canvas = within(canvasElement);
    const documentationLink = canvas.getByRole('link', { name: /Visit our documentation/ });
    const sourceLink = canvas.getByRole('link', { name: /External resource/ });

    await step('実在する公式 URL と安全な外部リンク属性を公開する', async () => {
      await expect(documentationLink).toHaveAttribute('href', OFFICIAL_ITEM_URLS.docs);
      await expect(sourceLink).toHaveAttribute('href', OFFICIAL_ITEM_URLS.source);
      await expect(sourceLink).toHaveAttribute('target', '_blank');
      await expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    await step('Tab 順序と Enter 操作を native link semantics で維持する', async () => {
      await userEvent.tab();
      await expect(documentationLink).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(documentationLinkClick).toHaveBeenCalledTimes(1);

      // 次の Tab で外部 source link へ移動し、Item 自体の focus-visible 契約を利用できることを保証する。
      await userEvent.tab();
      await expect(sourceLink).toHaveFocus();
    });
  },
};

/**
 * 公式 Icon 例の有効な Review と、完了済み項目の無効な Action を一つの状態一覧で示す。
 * play では Space による有効 Action の実行と、native disabled Action のフォーカス除外を検証する。
 */
export const ActionStates: Story = {
  render: () => (
    <ItemGroup className="max-w-lg" aria-label="Action states">
      <Item role="listitem" variant="outline">
        <ItemMedia variant="icon" aria-hidden="true">
          <ShieldAlertIcon />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>Security Alert</ItemTitle>
          <ItemDescription>New login detected from unknown device.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button type="button" size="sm" variant="outline" onClick={reviewActionClick}>
            Review
          </Button>
        </ItemActions>
      </Item>

      <Item role="listitem" variant="muted">
        <ItemMedia variant="icon" aria-hidden="true">
          <BadgeCheckIcon />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>Your profile has been verified.</ItemTitle>
          <ItemDescription id="verification-complete-description">
            No further action is required.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            aria-describedby="verification-complete-description"
          >
            Verified
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を除き、この Story で発生した Review 通知だけを検証する。
    reviewActionClick.mockClear();

    // Action は可視名と native state で取得し、見た目だけへ状態判定を依存させない。
    const canvas = within(canvasElement);
    const reviewAction = canvas.getByRole('button', { name: 'Review' });
    const verifiedAction = canvas.getByRole('button', { name: 'Verified' });

    await step('有効・無効の Action を native state として公開する', async () => {
      await expect(reviewAction).toBeEnabled();
      await expect(verifiedAction).toBeDisabled();
    });

    await step(
      'Space は有効 Action だけを実行し、disabled Action は Tab 順序から外す',
      async () => {
        await userEvent.tab();
        await expect(reviewAction).toHaveFocus();
        await userEvent.keyboard(' ');
        await expect(reviewActionClick).toHaveBeenCalledTimes(1);

        // native disabled button を Tab が飛ばし、操作不能状態へキーボードフォーカスを残さないことを保証する。
        await userEvent.tab();
        await expect(verifiedAction).not.toHaveFocus();
      }
    );
  },
};

/** 公式 Avatar 例の単一人物と人物グループを、可視名を持つ Invite Action とともに提示する。 */
export const AvatarActions: Story = {
  render: () => (
    <ItemGroup className="max-w-lg" aria-label="Avatar actions">
      <Item role="listitem" variant="outline">
        <ItemMedia>
          <PersonAvatar person={people[2]} size="lg" />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>Evil Rabbit</ItemTitle>
          <ItemDescription>Last seen 5 months ago</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            className="rounded-full"
            aria-label="Invite Evil Rabbit"
          >
            <PlusIcon />
          </Button>
        </ItemActions>
      </Item>

      <Item role="listitem" variant="outline">
        <ItemMedia>
          <TeamAvatarStack />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>No Team Members</ItemTitle>
          <ItemDescription>Invite your team to collaborate on this project.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button type="button" size="sm" variant="outline">
            Invite
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
};

/**
 * 公式 Image 例の三曲を、同じ画像 URL とコピーを持つ実在 Docs section へのリンク一覧として提示する。
 * listitem と link を別要素へ分け、一覧構造とキーボード操作の両方を支援技術へ保持する。
 */
export const ImageLinks: Story = {
  render: () => (
    <ItemGroup className="max-w-md" aria-label="Music">
      {music.map((song) => (
        <div key={song.title} role="listitem">
          <Item
            variant="outline"
            render={
              <a
                href={`${OFFICIAL_ITEM_URLS.docs}#image`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ItemMedia variant="image">
              <img
                src={`https://avatar.vercel.sh/${song.title}`}
                alt={song.title}
                width={32}
                height={32}
                loading="lazy"
                className="grayscale"
              />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle>
                {song.title} - <span className="text-muted-foreground">{song.album}</span>
              </ItemTitle>
              <ItemDescription>{song.artist}</ItemDescription>
            </ItemContent>
            <ItemContent className="flex-none text-center">
              <ItemDescription>{song.duration}</ItemDescription>
            </ItemContent>
          </Item>
        </div>
      ))}
    </ItemGroup>
  ),
};

/** 公式 Group 例の人物を、ItemGroup と装飾的な ItemSeparator で一つの招待一覧へまとめる。 */
export const GroupAndSeparator: Story = {
  render: () => (
    <ItemGroup className="max-w-md" aria-label="Team members">
      {people.map((person, index) => (
        <Fragment key={person.username}>
          <Item role="listitem">
            <ItemMedia>
              <PersonAvatar person={person} fallback={person.username.charAt(0)} />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle>{person.username}</ItemTitle>
              <ItemDescription>{person.email}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label={`Invite ${person.username}`}
              >
                <PlusIcon />
              </Button>
            </ItemActions>
          </Item>

          {index === people.length - 1 ? null : (
            // 反復する視覚的区切りは読み上げず、listitem の連続した意味を保つ。
            <ItemSeparator aria-hidden="true" />
          )}
        </Fragment>
      ))}
    </ItemGroup>
  ),
};

/** 公式 Header 例の先頭モデルを、同じ画像 URL とクレジットを持つ単一の Header・Footer 項目で示す。 */
export const HeaderAndFooter: Story = {
  render: () => (
    <Item
      role="article"
      aria-labelledby="featured-model-title"
      variant="outline"
      className="max-w-sm items-stretch"
    >
      <ItemHeader>
        <img
          src={featuredModel.image}
          alt={featuredModel.name}
          width={640}
          height={640}
          loading="lazy"
          className="aspect-square w-full rounded-sm object-cover"
        />
      </ItemHeader>
      <ItemContent className="min-w-0">
        <ItemTitle id="featured-model-title" role="heading" aria-level={2}>
          {featuredModel.name}
        </ItemTitle>
        <ItemDescription>{featuredModel.description}</ItemDescription>
      </ItemContent>
      <ItemFooter className="text-xs text-muted-foreground">
        <span>{featuredModel.credit}</span>
      </ItemFooter>
    </Item>
  ),
};
