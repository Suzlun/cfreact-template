import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Avatar, AvatarFallback, AvatarImage } from '@cfreact-template/ui/components/avatar';
import { buttonVariants } from '@cfreact-template/ui/components/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@cfreact-template/ui/components/hover-card';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 公式 shadcn/ui の Hover Card 例から取得した、Next.js プロフィールの固定表示と開閉条件。
 *
 * Story の描画と interaction test が同じ値を参照することで、外部状態や時刻に左右されない
 * 決定的な確認を行う。アバター URL を除き、読み取り時の通信や副作用はない。
 */
const nextJsProfile = {
  avatarFallback: 'VC',
  avatarUrl: 'https://github.com/vercel.png',
  biography: 'The React Framework – created and maintained by @vercel.',
  closeDelay: 100,
  handle: '@nextjs',
  joined: 'Joined December 2021',
  openDelay: 10,
  profileUrl: 'https://nextjs.org',
  triggerId: 'hover-card-nextjs-profile-trigger',
} as const;

/** HoverCard TriggerがPopupの開状態を公開する既存data属性名。 */
const popupOpenAttribute = 'data-popup-open';

/** HoverCard Root の公開 props から、プロフィール表示が内部で構成する children を除いた型。 */
type HoverCardRootProps = Omit<ComponentProps<typeof HoverCard>, 'children'>;

/** 公式プロフィール表示へ渡す HoverCard Root の公開状態。 */
interface NextJsProfileHoverCardProps {
  /** Storybook から受け取る HoverCard Root の公開 props。 */
  rootProps: HoverCardRootProps;
}

/**
 * 公式 shadcn/ui の `@nextjs` 例を、既存の Base UI HoverCard と design token で描画する。
 *
 * @param props Story ごとに指定する Root の公開状態。
 * @returns 実在するリンクを Trigger とし、アバター、説明、参加時期を提示する HoverCard。
 */
function NextJsProfileHoverCard({ rootProps }: NextJsProfileHoverCardProps) {
  return (
    <HoverCard {...rootProps}>
      {/* Base UI が描画する anchor へ公式例の link variant を適用し、入れ子の操作要素を作らない。 */}
      <HoverCardTrigger
        className={buttonVariants({ variant: 'link' })}
        closeDelay={nextJsProfile.closeDelay}
        delay={nextJsProfile.openDelay}
        href={nextJsProfile.profileUrl}
        id={nextJsProfile.triggerId}
      >
        {nextJsProfile.handle}
      </HoverCardTrigger>

      <HoverCardContent className="w-80 max-w-[calc(100vw-2rem)]">
        {/* registry example の gap と情報順序を保ち、狭幅では本文列だけを安全に縮める。 */}
        <div className="flex justify-between gap-4">
          {/* 隣接するプロフィール名が同じ対象を伝えるため、アバターは支援技術へ重複通知しない。 */}
          <Avatar aria-hidden="true">
            <AvatarImage alt="" referrerPolicy="no-referrer" src={nextJsProfile.avatarUrl} />
            <AvatarFallback>{nextJsProfile.avatarFallback}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            {/* Base UI example と同じ非見出しラベルにし、埋め込み先の heading 階層へ干渉させない。 */}
            <div className="text-sm font-semibold">{nextJsProfile.handle}</div>
            <p className="break-words text-pretty text-sm leading-5">{nextJsProfile.biography}</p>
            <div className="text-xs text-muted-foreground">{nextJsProfile.joined}</div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * Portal 内で開いた HoverCardContent を取得し、既存の Portal と focus 契約を確認する。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument と Portal 外判定に使用する。
 * @returns Portal 内で開状態かつ可視になった HoverCardContent。
 * @throws Content または Portal が既存 data-slot を伴って描画されない場合に失敗する。
 */
async function findOpenHoverCard(canvasElement: HTMLElement): Promise<HTMLElement> {
  const ownerDocument = canvasElement.ownerDocument;

  // animation の固定時間を仮定せず、公開 data-slot と open 状態が揃うまで待機する。
  const content = await waitFor(() => {
    const popup = ownerDocument.querySelector<HTMLElement>('[data-slot="hover-card-content"]');

    if (popup?.hasAttribute('data-open') !== true) {
      throw new TypeError('HoverCardContent が Portal 内で開いていません。');
    }

    return popup;
  });

  // Content の実際の祖先から、この component が生成した Portal container を特定する。
  const portal = content.closest<HTMLElement>('[data-slot="hover-card-portal"]');

  if (portal === null) {
    throw new TypeError('HoverCardContent の Portal が描画されていません。');
  }

  // 配置座標の確定後に Content が見えるまで待ち、DOM 挿入だけを表示完了と誤認しない。
  await waitFor(async () => {
    await expect(content).toBeVisible();
  });

  // 非対話の preview は focus 順序へ入れず、同じ document の canvas 外 Portal に置く。
  await expect(content).toHaveAttribute('tabindex', '-1');
  await expect(canvasElement.contains(portal)).toBe(false);
  await expect(ownerDocument.body.contains(portal)).toBe(true);

  return content;
}

/**
 * 公式プロフィールの可視情報、画像 URL、装飾 avatar のアクセシビリティ属性を確認する。
 *
 * @param content Portal 内で開いている HoverCardContent。
 * @returns プロフィール名、説明、metadata、avatar の確認が完了した時点で解決する Promise。
 * @throws Avatar が描画されない、または公式 URL 以外の画像が描画された場合に失敗する。
 */
async function expectProfileContent(content: HTMLElement): Promise<void> {
  const contentCanvas = within(content);

  // visible hierarchy を公式固定コピーで確認し、class 名だけの検証に依存しない。
  await expect(contentCanvas.getByText(nextJsProfile.handle)).toBeVisible();
  await expect(contentCanvas.getByText(nextJsProfile.biography)).toBeVisible();
  await expect(contentCanvas.getByText(nextJsProfile.joined)).toBeVisible();

  // 通信状態にかかわらず常在する Avatar を取得し、プロフィール名との重複読み上げを防ぐ。
  const avatar = content.querySelector<HTMLElement>('[data-slot="avatar"]');
  if (avatar === null) {
    throw new TypeError('公式プロフィールの Avatar が描画されていません。');
  }
  await expect(avatar).toHaveAttribute('aria-hidden', 'true');

  // 画像が取得前または失敗後に除去される場合は fallback に任せ、存在する場合だけ公式 URL を保証する。
  const avatarImage = avatar.querySelector<HTMLElement>('[data-slot="avatar-image"]');
  if (avatarImage !== null) {
    await expect(avatarImage).toHaveAttribute('alt', '');
    await expect(avatarImage).toHaveAttribute('src', nextJsProfile.avatarUrl);
  }
}

/**
 * 開いたプロフィールが現在の viewport 内で折り返され、横方向へ溢れないことを確認する。
 *
 * @param canvasElement Story と Content が共有する document を特定する Story canvas。
 * @param content 可視状態かつ配置済みの HoverCardContent。
 * @returns viewport 余白、Content 幅、内部 overflow の確認が完了した時点で解決する Promise。
 */
async function expectResponsiveContent(
  canvasElement: HTMLElement,
  content: HTMLElement
): Promise<void> {
  const viewportWidth = canvasElement.ownerDocument.documentElement.clientWidth;

  // 既存 utility と実寸の双方を確認し、390px project でも左右 16px 以上の余白を維持する。
  await expect(content).toHaveClass('w-80', 'max-w-[calc(100vw-2rem)]');
  await expect(content.getBoundingClientRect().width).toBeLessThanOrEqual(viewportWidth - 32);

  // 公式コピーと fallback のどちらが描画されても、内部内容が Content 自体を押し広げないことを保証する。
  await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
}

/**
 * 終了 animation 後に HoverCardContent と Portal が document から除去されたことを確認する。
 *
 * @param canvasElement Portal と同じ ownerDocument を特定する Story canvas。
 * @returns Content と Portal の除去が完了した時点で解決する Promise。
 */
async function expectHoverCardClosed(canvasElement: HTMLElement): Promise<void> {
  const ownerDocument = canvasElement.ownerDocument;

  // 終了 animation の長さへ依存せず、Content と Portal container の実際の除去を待つ。
  await waitFor(async () => {
    await expect(
      ownerDocument.querySelector('[data-slot="hover-card-content"]')
    ).not.toBeInTheDocument();
    await expect(
      ownerDocument.querySelector('[data-slot="hover-card-portal"]')
    ).not.toBeInTheDocument();
  });
}

/**
 * 公式プロフィール preview と HoverCard の全公開サブコンポーネントを CSF 3 へ登録する。
 *
 * 固定データ、既存 API、既存 token だけで構成し、Story の状態を外部処理へ接続しない。
 */
const meta = {
  title: 'Components/HoverCard',
  component: HoverCard,
  subcomponents: {
    HoverCardTrigger,
    HoverCardContent,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn/ui の @nextjs プロフィール例を使い、実在するリンク Trigger、Portal 内 Content、通常・open・hover・focus・Escape の状態、狭幅での折り返しを確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof HoverCard>;

/** Storybook が HoverCard の型、Docs、accessibility、interaction tests を構築するための既定 export。 */
export default meta;

/** metadata から HoverCard Story の CSF 3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式 `@nextjs` プロフィールを通常状態から開き、pointer と keyboard の開閉を検証する。
 *
 * @remarks interaction 完了後はリンクへ focus を残し、focus-visible 表現を Story 上で確認できる。
 */
export const ProfilePreview: Story = {
  render: (args) => <NextJsProfileHoverCard rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // Trigger は canvas、Content と Portal は body に描画されるため、検索範囲を責務ごとに分ける。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: nextJsProfile.handle });

    // HoverCard を利用できない環境でも、Trigger が実在する Next.js の情報先へ遷移できることを保証する。
    await expect(trigger).toHaveAttribute('href', nextJsProfile.profileUrl);
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="hover-card-portal"]')
    ).not.toBeInTheDocument();

    await step('pointer hover で公式プロフィールを開閉する', async () => {
      // focus に依存しない pointer 経路で開き、Portal 内の完全なプロフィールを確認する。
      await userEvent.hover(trigger);
      const content = await findOpenHoverCard(canvasElement);
      await expectProfileContent(content);
      await expectResponsiveContent(canvasElement, content);
      await expect(trigger).toHaveAttribute(popupOpenAttribute);

      // pointer を外し、公式 example と同じ closeDelay 後に Portal ごと閉じるまで待機する。
      await userEvent.unhover(trigger);
      await expectHoverCardClosed(canvasElement);
      await expect(trigger).not.toHaveAttribute(popupOpenAttribute);
    });

    await step('keyboard focus で開き、Escape で閉じる', async () => {
      // hover 検証後の focus を解放し、Tab による通常の keyboard 経路でリンクへ到達する。
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      await userEvent.tab();
      await expect(trigger).toHaveFocus();

      // focus により再度開いた Content を確認し、pointer の結果が残存していないことを保証する。
      const content = await findOpenHoverCard(canvasElement);
      await expectProfileContent(content);
      await expectResponsiveContent(canvasElement, content);
      await expect(trigger).toHaveAttribute(popupOpenAttribute);

      // Escape では preview だけを閉じ、利用者の focus とリンク先を Trigger に保つ。
      await userEvent.keyboard('{Escape}');
      await expectHoverCardClosed(canvasElement);
      await expect(trigger).toHaveFocus();
      await expect(trigger).not.toHaveAttribute(popupOpenAttribute);
    });
  },
};

/**
 * 公式プロフィールを開いた状態で固定し、表示内容と 390px を含む responsive 幅を検証する。
 *
 * @remarks 同じ Story が light・dark・desktop・390px の共通 test project で描画される。
 */
export const OpenProfilePreview: Story = {
  args: {
    defaultOpen: true,
    defaultTriggerId: nextJsProfile.triggerId,
  },
  render: (args) => <NextJsProfileHoverCard rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    await step('開いた公式プロフィールを viewport 内へ完全に表示する', async () => {
      // defaultTriggerId で対象リンクを明示し、初期 open 状態を描画順序へ依存させない。
      const content = await findOpenHoverCard(canvasElement);
      await expectProfileContent(content);
      await expectResponsiveContent(canvasElement, content);

      // 開状態を Story の最終表示として保持し、通常 Story の focus 状態と役割を分離する。
      const trigger = within(canvasElement).getByRole('link', { name: nextJsProfile.handle });
      await expect(trigger).toHaveAttribute(popupOpenAttribute);
    });
  },
};
