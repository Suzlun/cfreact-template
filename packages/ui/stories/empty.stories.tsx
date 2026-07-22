import { ArrowUpRightIcon, CloudIcon, FolderCodeIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Avatar, AvatarFallback, AvatarImage } from '@cfreact-template/ui/components/avatar';
import { Button, buttonVariants } from '@cfreact-template/ui/components/button';
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
  InputGroupInput,
} from '@cfreact-template/ui/components/input-group';
import { Kbd } from '@cfreact-template/ui/components/kbd';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** shadcn/ui 公式 Empty examples が使用する GitHub Avatar URL。 */
const OFFICIAL_AVATAR_SOURCES = {
  evilrabbit: 'https://github.com/evilrabbit.png',
  maxleiter: 'https://github.com/maxleiter.png',
  shadcn: 'https://github.com/shadcn.png',
} as const;

/** 公式先頭例の見出し、説明、操作名を一つの固定データとして保持する。 */
const projectCopy = {
  title: 'No Projects Yet',
  description: "You haven't created any projects yet. Get started by creating your first project.",
  primaryAction: 'Create Project',
  secondaryAction: 'Import Project',
  supportingAction: 'Learn More',
} as const;

/** 公式 Outline 例の cloud storage 状態と回復操作を保持する。 */
const cloudCopy = {
  title: 'Cloud Storage Empty',
  description: 'Upload files to your cloud storage to access them anywhere.',
  action: 'Upload Files',
} as const;

/** 公式 Avatar 例の offline 状態を保持する。 */
const offlineCopy = {
  title: 'User Offline',
  description:
    'This user is currently offline. You can leave a message to notify them or try again later.',
  action: 'Leave Message',
} as const;

/** 公式 Avatar Group 例の team 状態を保持する。 */
const teamCopy = {
  title: 'No Team Members',
  description: 'Invite your team to collaborate on this project.',
  action: 'Invite Members',
} as const;

/** 公式 InputGroup 例の 404 状態、検索入力、support 導線を保持する。 */
const notFoundCopy = {
  title: '404 - Not Found',
  description: "The page you're looking for doesn't exist. Try searching for what you need below.",
  inputLabel: 'Search pages',
  placeholder: 'Try searching for pages...',
  supportLead: 'Need help?',
  supportAction: 'Contact support',
  typedValue: 'installation',
} as const;

/** 全 Empty Story を同じ実用寸法に保ち、390px でも横幅を viewport 内へ収める共通配置。 */
const emptyClassName = 'mx-auto min-h-80 max-w-2xl';

/** 狭幅では標準 Button を 44px 以上かつ全幅にし、広幅では既定寸法へ戻す。 */
const responsiveActionClassName = 'min-h-11 w-full sm:min-h-8 sm:w-auto';

/** 狭幅では small Button も 44px 以上かつ全幅にし、広幅では公式の small 寸法へ戻す。 */
const responsiveSmallActionClassName = 'min-h-11 w-full sm:min-h-7 sm:w-auto';

/** Story 外の作用を発生させず、project 作成操作を interaction test から観測する spy。 */
const createProjectClick = fn();

/** Story 外の作用を発生させず、project 取り込み操作を interaction test から観測する spy。 */
const importProjectClick = fn();

/** Story 外の作用を発生させず、file upload 操作を interaction test から観測する spy。 */
const uploadFilesClick = fn();

/**
 * Empty の公式 default、outline、Avatar、Avatar Group、InputGroup 利用例を登録する。
 *
 * 公式 examples の可視コピーと情報構造を保ち、既存 token と公開 component だけで
 * light/dark、desktop、390px、keyboard、screen reader の各利用条件へ対応する。
 */
const meta = {
  title: 'Components/Empty',
  component: Empty,
  subcomponents: {
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式例に沿った、project 作成、upload、offline recovery、team invitation、404 search の実用的な Empty states を確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Empty>;

/** Storybook が Empty catalog の Docs、accessibility、browser tests を構築する既定 export。 */
export default meta;

/** metadata から Empty Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式先頭例と同じ project 初回状態、主副操作、補助 link を示す主要 Story。
 *
 * interaction test は二つの Button がそれぞれの handler だけへ通知することと、
 * 狭幅でも Empty 自体が横 overflow を発生させないことを確認する。
 */
export const Default: Story = {
  render: () => (
    <Empty
      aria-describedby="empty-project-description"
      aria-labelledby="empty-project-title"
      className={emptyClassName}
      role="region"
    >
      <EmptyHeader>
        {/* 公式と同じ project icon の役割を既存 Lucide icon で表し、重複読み上げを防ぐ。 */}
        <EmptyMedia aria-hidden="true" variant="icon">
          <FolderCodeIcon />
        </EmptyMedia>
        {/* div ベースの公開 API へ heading semantics を補い、空状態の読み始めを明確にする。 */}
        <EmptyTitle aria-level={2} id="empty-project-title" role="heading">
          {projectCopy.title}
        </EmptyTitle>
        <EmptyDescription id="empty-project-description">
          {projectCopy.description}
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent
        aria-label="Project actions"
        className="sm:flex-row sm:justify-center"
        role="group"
      >
        {/* 作成を主操作として先に置き、390px では一つずつ押しやすい全幅へ切り替える。 */}
        <Button className={responsiveActionClassName} onClick={createProjectClick} type="button">
          {projectCopy.primaryAction}
        </Button>
        {/* 取り込みは公式どおり outline にし、作成操作との視覚的優先度を分ける。 */}
        <Button
          className={responsiveActionClassName}
          onClick={importProjectClick}
          type="button"
          variant="outline"
        >
          {projectCopy.secondaryAction}
        </Button>
      </EmptyContent>

      {/* 公式の補助 link を Button の既存 variant で再現し、同じ Story 内の説明へ安全に結ぶ。 */}
      <a
        className={buttonVariants({
          className: 'min-h-11 text-muted-foreground sm:min-h-7',
          size: 'sm',
          variant: 'link',
        })}
        href="#empty-project-description"
      >
        {projectCopy.supportingAction}
        <ArrowUpRightIcon aria-hidden="true" />
      </a>
    </Empty>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を除き、この Story 内で発生する通知だけを検証する。
    createProjectClick.mockClear();
    importProjectClick.mockClear();

    // Story canvas 内を可視名で検索し、Storybook 管理 UI の操作要素を対象外にする。
    const canvas = within(canvasElement);
    const empty = canvas.getByRole('region', { name: projectCopy.title });
    const createAction = canvas.getByRole('button', { name: projectCopy.primaryAction });
    const importAction = canvas.getByRole('button', { name: projectCopy.secondaryAction });

    await step('公式の情報階層と横幅を維持する', async () => {
      // 見出しを region 名として公開し、390px project でも root の横 overflow を許さない。
      await expect(empty).toHaveAccessibleDescription(projectCopy.description);
      await expect(empty.scrollWidth).toBeLessThanOrEqual(empty.clientWidth);
      await expect(
        canvas.getByRole('link', { name: projectCopy.supportingAction })
      ).toHaveAttribute('href', '#empty-project-description');
    });

    await step('作成操作を主 handler だけへ通知する', async () => {
      // 利用者と同じ pointer 操作で、主操作の通知先と回数を確認する。
      await userEvent.click(createAction);
      await expect(createProjectClick).toHaveBeenCalledTimes(1);
      await expect(importProjectClick).not.toHaveBeenCalled();
    });

    await step('取り込み操作を副 handler だけへ通知する', async () => {
      // 二つ目の操作後も、先に実行した主操作の回数が変化しないことを保証する。
      await userEvent.click(importAction);
      await expect(importProjectClick).toHaveBeenCalledTimes(1);
      await expect(createProjectClick).toHaveBeenCalledTimes(1);
    });
  },
};

/** 公式 Outline 例と同じ border、cloud icon、upload 操作を持つ empty storage 状態。 */
export const Outline: Story = {
  render: () => (
    <Empty
      aria-describedby="empty-cloud-description"
      aria-labelledby="empty-cloud-title"
      className={`${emptyClassName} border border-dashed`}
      role="region"
    >
      <EmptyHeader>
        {/* cloud icon は状態を補助する装飾とし、見出しを一度だけ読み上げる。 */}
        <EmptyMedia aria-hidden="true" variant="icon">
          <CloudIcon />
        </EmptyMedia>
        <EmptyTitle aria-level={2} id="empty-cloud-title" role="heading">
          {cloudCopy.title}
        </EmptyTitle>
        <EmptyDescription id="empty-cloud-description">{cloudCopy.description}</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        {/* 公式の small outline 操作を保ち、390px だけは touch target と横幅を拡張する。 */}
        <Button
          className={responsiveSmallActionClassName}
          onClick={uploadFilesClick}
          size="sm"
          type="button"
          variant="outline"
        >
          {cloudCopy.action}
        </Button>
      </EmptyContent>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    // 再実行前の履歴を除外し、現在の upload 操作だけを決定的に検証する。
    uploadFilesClick.mockClear();

    // 可視ラベルから native button を取得し、click が公開 handler へ一度届くことを確認する。
    const action = within(canvasElement).getByRole('button', { name: cloudCopy.action });
    await userEvent.click(action);
    await expect(uploadFilesClick).toHaveBeenCalledTimes(1);
  },
};

/** 公式 Avatar 例と同じ画像 URL、grayscale、offline copy、message 操作を示す。 */
export const AvatarMedia: Story = {
  name: 'Avatar',
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default">
          {/* 公式 source と同じ Avatar 合成を保ち、画像の load 成否は Base UI の fallback 契約へ委ねる。 */}
          <Avatar className="size-12">
            <AvatarImage src={OFFICIAL_AVATAR_SOURCES.shadcn} className="grayscale" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
        </EmptyMedia>
        <EmptyTitle>{offlineCopy.title}</EmptyTitle>
        <EmptyDescription>{offlineCopy.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {/* 公式 source と同じ small Button を、追加の Story 専用作用を持たせず表示する。 */}
        <Button size="sm">{offlineCopy.action}</Button>
      </EmptyContent>
    </Empty>
  ),
};

/** 公式 Avatar Group 例と同じ三人、画像 URL、順序、team invitation 操作を示す。 */
export const AvatarGroupMedia: Story = {
  name: 'Avatar group',
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          {/* 公式 source と同じ通常の div、重なり、ring、grayscale をそのまま適用する。 */}
          <div className="flex -space-x-2 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:grayscale">
            <Avatar>
              <AvatarImage src={OFFICIAL_AVATAR_SOURCES.shadcn} alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src={OFFICIAL_AVATAR_SOURCES.maxleiter} alt="@maxleiter" />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src={OFFICIAL_AVATAR_SOURCES.evilrabbit} alt="@evilrabbit" />
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
          </div>
        </EmptyMedia>
        <EmptyTitle>{teamCopy.title}</EmptyTitle>
        <EmptyDescription>{teamCopy.description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {/* 公式 source と同じ Plus icon と small Button の合成を表示する。 */}
        <Button size="sm">
          <PlusIcon />
          {teamCopy.action}
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

/** 公式 InputGroup 例と同じ 404 copy、検索 icon、shortcut、support link を示す。 */
export const InputGroupSearch: Story = {
  name: 'Input group',
  render: () => (
    <Empty
      aria-describedby="empty-not-found-description"
      aria-labelledby="empty-not-found-title"
      className={emptyClassName}
      role="region"
    >
      <EmptyHeader>
        <EmptyTitle aria-level={2} id="empty-not-found-title" role="heading">
          {notFoundCopy.title}
        </EmptyTitle>
        <EmptyDescription id="empty-not-found-description">
          {notFoundCopy.description}
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        {/* 可視 copy は公式のままにし、placeholder だけへ依存しない入力名を追加する。 */}
        <InputGroup aria-label={notFoundCopy.inputLabel} className="h-11 sm:h-8 sm:w-3/4">
          <InputGroupInput
            aria-label={notFoundCopy.inputLabel}
            placeholder={notFoundCopy.placeholder}
            type="search"
          />
          <InputGroupAddon aria-hidden="true">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            {/* 公式の slash hint を keyboard 要素として保ち、記号の読み方を明示する。 */}
            <Kbd aria-label="Slash">/</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <EmptyDescription>
          {notFoundCopy.supportLead}{' '}
          {/* 公式の補助 action を inline link として保ち、390px では最低 touch target 高を確保する。 */}
          <a className="inline-flex min-h-11 items-center sm:min-h-6" href="#">
            {notFoundCopy.supportAction}
          </a>
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  ),
  play: async ({ canvasElement, step }) => {
    // 入力と support link を可視名で取得し、DOM 順序や Storybook chrome に依存しないようにする。
    const canvas = within(canvasElement);
    const empty = canvas.getByRole('region', { name: notFoundCopy.title });
    const input = canvas.getByRole('searchbox', { name: notFoundCopy.inputLabel });
    const support = canvas.getByRole('link', { name: notFoundCopy.supportAction });

    await step('404 状態を検索と support の二つの回復経路へ結ぶ', async () => {
      // region の説明、link semantics、390px での横幅をまとめて確認する。
      await expect(empty).toHaveAccessibleDescription(notFoundCopy.description);
      await expect(empty.scrollWidth).toBeLessThanOrEqual(empty.clientWidth);
      await expect(support).toHaveAttribute('href', '#');
    });

    await step('検索語を keyboard で入力できる', async () => {
      // 実際の利用者と同じ入力操作を行い、ラベル付き searchbox の値へ完全に反映する。
      await userEvent.type(input, notFoundCopy.typedValue);
      await expect(input).toHaveValue(notFoundCopy.typedValue);
    });
  },
};
