import { FileIcon, ImageIcon, TriangleAlertIcon, UploadIcon, XIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@cfreact-template/ui/components/attachment';
import { Spinner } from '@cfreact-template/ui/components/spinner';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** `Attachment` が公開する全 state を Controls と比較 Story で共有する固定値。 */
const stateOptions = ['idle', 'uploading', 'processing', 'error', 'done'] as const;

/** `Attachment` が公開する全 size を Controls と比較 Story で共有する固定値。 */
const sizeOptions = ['default', 'sm', 'xs'] as const;

/** `Attachment` が公開する全 orientation を Controls と比較 Story で共有する固定値。 */
const orientationOptions = ['horizontal', 'vertical'] as const;

/** `AttachmentMedia` が公開する全 variant を比較 Story で共有する固定値。 */
const mediaVariantOptions = ['icon', 'image'] as const;

/**
 * 画像用 variant を外部通信なしで描画するための空のインライン SVG。
 * 見た目は既存の `muted` token と `ImageIcon` だけで補い、製品固有の画像や色を持ち込まない。
 */
const inlineImageSource =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22%3E%3C/svg%3E';

type AttachmentState = NonNullable<ComponentProps<typeof Attachment>['state']>;
type AttachmentMediaVariant = NonNullable<ComponentProps<typeof AttachmentMedia>['variant']>;

/** Story 専用の表示内容を一つにまとめ、各比較で title と description の対応を保つ。 */
interface AttachmentCopy {
  /** `AttachmentTitle` に表示し、操作名にも利用する製品非依存のファイル名。 */
  title: string;
  /** `AttachmentDescription` に表示する容量または処理状態。 */
  description: string;
  /** 画像 variant の代替テキスト。画像を使わない例では省略する。 */
  imageAlt?: string;
}

/** Story 専用の共通構成へ渡す root props、固定表示内容、任意の操作契約。 */
interface AttachmentPreviewProps {
  /** `Attachment` root へそのまま渡す既存の公開 props。 */
  rootProps?: Omit<ComponentProps<typeof Attachment>, 'children'>;
  /** title、description、画像の代替テキストを保持する固定表示内容。 */
  copy: AttachmentCopy;
  /** `AttachmentMedia` の既存 variant。未指定時は icon を使用する。 */
  mediaVariant?: AttachmentMediaVariant;
  /** `AttachmentActions` と `AttachmentAction` を含めるかを決める Story 専用フラグ。 */
  withAction?: boolean;
  /** 全面操作用の `AttachmentTrigger` を含めるかを決める Story 専用フラグ。 */
  withTrigger?: boolean;
  /** icon-only action のクリックを外部作用なしで観測する Story 専用ハンドラー。 */
  onAction?: ComponentProps<typeof AttachmentAction>['onClick'];
  /** trigger のクリックを外部作用なしで観測する Story 専用ハンドラー。 */
  onTrigger?: ComponentProps<typeof AttachmentTrigger>['onClick'];
}

/** Playground と各 variant 比較で共用する標準量の固定表示データ。 */
const standardCopy: AttachmentCopy = {
  title: 'document.pdf',
  description: '1.2 MB',
};

/**
 * 全 state の見た目と補足文を一対一で固定する catalog データ。
 * component 契約の列挙順に保ち、処理途中・失敗・完了の表示漏れを防ぐ。
 */
const stateCases: readonly { state: AttachmentState; copy: AttachmentCopy }[] = [
  {
    state: 'idle',
    copy: { title: 'idle-document.pdf', description: 'アップロード待ち' },
  },
  {
    state: 'uploading',
    copy: { title: 'uploading-document.pdf', description: 'アップロード中' },
  },
  {
    state: 'processing',
    copy: { title: 'processing-document.pdf', description: '処理中' },
  },
  {
    state: 'error',
    copy: { title: 'error-document.pdf', description: 'アップロードに失敗しました' },
  },
  {
    state: 'done',
    copy: { title: 'done-document.pdf', description: '1.2 MB' },
  },
];

/** `AttachmentGroup` の横スクロール、snap、状態混在を再現可能に示す固定項目。 */
const groupItems: readonly { state: AttachmentState; copy: AttachmentCopy }[] = [
  {
    state: 'done',
    copy: { title: 'guide.pdf', description: '840 KB' },
  },
  {
    state: 'processing',
    copy: { title: 'notes.txt', description: '処理中' },
  },
  {
    state: 'error',
    copy: { title: 'archive.zip', description: 'アップロードに失敗しました' },
  },
];

/** `AttachmentTrigger` と `AttachmentAction` の通知を外部作用なしで個別観測する spy。 */
const triggerClick = fn();
const actionClick = fn();

/**
 * state に応じて既存 icon または `Spinner` を `AttachmentMedia` へ配置する。
 *
 * @param state `Attachment` root と一致させる既存の state。
 * @returns state の意味を重複読み上げしない装飾 icon、または進行中を通知する status icon。
 */
function StateMedia({ state }: { state: AttachmentState }) {
  if (state === 'uploading') {
    // アップロード中だけ status semantics を持たせ、視覚的な回転と読み上げを一致させる。
    return <Spinner aria-label="アップロード中" />;
  }

  if (state === 'processing') {
    // 処理中も同じ既存 Spinner を再利用し、状態名だけを正確に読み分ける。
    return <Spinner aria-label="処理中" />;
  }

  if (state === 'error') {
    // エラー色は `AttachmentMedia` 側の state token に委ね、icon 自体へ色を追加しない。
    return <TriangleAlertIcon aria-hidden="true" />;
  }

  if (state === 'idle') {
    // 待機状態を upload icon で示し、description と同じ文言の重複読み上げを避ける。
    return <UploadIcon aria-hidden="true" />;
  }

  // 残る done 状態は一般的なファイル icon で示し、ファイル名を title の読み上げへ任せる。
  return <FileIcon aria-hidden="true" />;
}

/**
 * icon と image の両 variant を、外部画像通信なしで同じ `AttachmentMedia` API から描画する。
 *
 * @param props state、media variant、固定表示内容。
 * @returns 指定 variant と state に対応する `AttachmentMedia`。
 */
function MediaPreview({
  state,
  variant,
  copy,
}: {
  state: AttachmentState;
  variant: AttachmentMediaVariant;
  copy: AttachmentCopy;
}) {
  if (variant === 'image') {
    return (
      <AttachmentMedia variant="image">
        {/* 空の data URL に既存 muted token を適用し、ネットワーク要求なしで img 契約を有効にする。 */}
        <img
          src={inlineImageSource}
          alt={copy.imageAlt ?? `${copy.title} の固定プレビュー`}
          className="bg-muted"
        />
        {/* 実画像を捏造せず image の種別だけを示し、意味は img の代替テキストへ集約する。 */}
        <ImageIcon aria-hidden="true" className="absolute size-4" />
      </AttachmentMedia>
    );
  }

  // icon variant は root の state と対応する既存 icon を中央へ配置する。
  return (
    <AttachmentMedia variant="icon">
      <StateMedia state={state} />
    </AttachmentMedia>
  );
}

/**
 * Attachment の全情報領域と任意の操作領域を正しい親子関係で組み立てる Story 専用 catalog。
 *
 * @param props root props、固定表示内容、media variant、任意の action・trigger 契約。
 * @returns 既存 Attachment API と token だけで構成された再利用可能な Story 表示。
 */
function AttachmentPreview({
  rootProps,
  copy,
  mediaVariant = 'icon',
  withAction = false,
  withTrigger = false,
  onAction,
  onTrigger,
}: AttachmentPreviewProps) {
  // media の状態表現を root と同期し、未指定時は Attachment の既定値である done に合わせる。
  const state = rootProps?.state ?? 'done';

  return (
    <Attachment {...rootProps}>
      {/* Media、Content、Title、Description の順序を公開 component の想定構造に合わせる。 */}
      <MediaPreview state={state} variant={mediaVariant} copy={copy} />
      <AttachmentContent>
        <AttachmentTitle>{copy.title}</AttachmentTitle>
        {/* error の小さい説明文は既存 destructive token を不透明で使い、両テーマの文字 contrast を保つ。 */}
        <AttachmentDescription className={state === 'error' ? 'text-destructive!' : undefined}>
          {copy.description}
        </AttachmentDescription>
      </AttachmentContent>

      {withTrigger ? (
        // 全面 trigger は可視テキストを持たないため、対象ファイルと操作を含む名前を明示する。
        <AttachmentTrigger aria-label={`${copy.title} を開く`} onClick={onTrigger} />
      ) : null}

      {withAction ? (
        <AttachmentActions>
          {/* icon-only action は trigger と区別できる具体的なアクセシブル名を必須とする。 */}
          <AttachmentAction aria-label={`${copy.title} を削除`} onClick={onAction}>
            <XIcon aria-hidden="true" />
          </AttachmentAction>
        </AttachmentActions>
      ) : null}
    </Attachment>
  );
}

/**
 * Attachment と全サブコンポーネントを CSF 3 の Docs・Controls・a11y 検査へ直接登録する。
 * Template Notice に従って製品文脈を仮定せず、既存 API、token、固定データだけを表示する。
 */
const meta = {
  title: 'Components/Attachment',
  component: Attachment,
  subcomponents: {
    AttachmentGroup,
    AttachmentMedia,
    AttachmentContent,
    AttachmentTitle,
    AttachmentDescription,
    AttachmentActions,
    AttachmentAction,
    AttachmentTrigger,
  },
  args: {
    state: 'done',
    size: 'default',
    orientation: 'horizontal',
  },
  argTypes: {
    state: {
      control: 'select',
      options: stateOptions,
      description: '待機、転送、処理、失敗、完了を表す既存の状態。',
    },
    size: {
      control: 'inline-radio',
      options: sizeOptions,
      description: 'Attachment 全体と media の既存寸法。',
    },
    orientation: {
      control: 'inline-radio',
      options: orientationOptions,
      description: '情報領域を横または縦に配置する既存方向。',
    },
  },
  parameters: {
    layout: 'centered',
    controls: {
      include: ['state', 'size', 'orientation'],
    },
    docs: {
      description: {
        component:
          'ファイルの media、content、title、description、actions、action、trigger と、複数項目用 group を組み合わせる Attachment。製品固有の文脈や外部画像通信を追加せず、公開済みの全 state・size・orientation を確認できます。',
      },
    },
  },
  render: (args) => (
    <AttachmentPreview
      rootProps={args}
      copy={standardCopy}
      withAction
      withTrigger
      onAction={actionClick}
      onTrigger={triggerClick}
    />
  ),
} satisfies Meta<typeof Attachment>;

/** Storybook が Attachment catalog の型、Docs、Controls、browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Controls から root の state・size・orientation を切り替え、全サブ領域を含む基本構成を確認する。
 * play では trigger と action のアクセシブル名、および二つのクリック通知が混線しないことを保証する。
 */
export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    // 再実行やテーマ別 browser test の履歴を除き、この Story 内で発生した通知だけを検証する。
    triggerClick.mockClear();
    actionClick.mockClear();

    // canvas 内をアクセシブル名で検索し、Storybook chrome の操作要素を誤取得しない。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'document.pdf を開く' });
    const action = canvas.getByRole('button', { name: 'document.pdf を削除' });

    await step('trigger と action が用途を区別できるアクセシブル名を持つ', async () => {
      await expect(trigger).toHaveAccessibleName('document.pdf を開く');
      await expect(action).toHaveAccessibleName('document.pdf を削除');
    });

    await step('trigger のクリックを trigger ハンドラーだけへ通知する', async () => {
      await userEvent.click(trigger);
      await expect(triggerClick).toHaveBeenCalledTimes(1);
      await expect(actionClick).not.toHaveBeenCalled();
    });

    await step('action のクリックを action ハンドラーだけへ通知する', async () => {
      await userEvent.click(action);
      await expect(actionClick).toHaveBeenCalledTimes(1);
      await expect(triggerClick).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * idle、uploading、processing、error、done の全 state を同じ構造で並べる。
 * border、shimmer、色、status icon の差だけを比較できるよう、state 以外の条件を固定する。
 */
export const States: Story = {
  render: ({ orientation, size }) => (
    <ul className="grid gap-4" aria-label="Attachment の全 state">
      {stateCases.map(({ state, copy }) => (
        <li key={state} className="flex min-w-0 items-center gap-4">
          {/* state 名を比較ラベルとして表示し、component 内の製品コピーへ混在させない。 */}
          <span className="w-20 shrink-0 text-xs text-muted-foreground">{state}</span>
          <AttachmentPreview rootProps={{ orientation, size, state }} copy={copy} />
        </li>
      ))}
    </ul>
  ),
};

/** default、sm、xs の全 size を同じ done 状態と horizontal 配置で比較する。 */
export const Sizes: Story = {
  render: ({ state }) => (
    <ul className="flex flex-wrap items-end gap-6" aria-label="Attachment の全 size">
      {sizeOptions.map((size) => (
        <li key={size} className="flex flex-col gap-2">
          {/* 寸法名は外側の caption とし、Attachment の title・description 契約を変えない。 */}
          <span className="text-xs text-muted-foreground">{size}</span>
          <AttachmentPreview
            rootProps={{ orientation: 'horizontal', size, state }}
            copy={standardCopy}
          />
        </li>
      ))}
    </ul>
  ),
};

/** horizontal と vertical の全 orientation を同じ content と size で比較する。 */
export const Orientations: Story = {
  render: ({ size, state }) => (
    <ul className="flex flex-wrap items-start gap-8" aria-label="Attachment の全 orientation">
      {orientationOptions.map((orientation) => (
        <li key={orientation} className="flex flex-col gap-2">
          {/* 方向名は比較用 caption として component の外へ置き、情報構造を維持する。 */}
          <span className="text-xs text-muted-foreground">{orientation}</span>
          <AttachmentPreview rootProps={{ orientation, size, state }} copy={standardCopy} />
        </li>
      ))}
    </ul>
  ),
};

/** `AttachmentMedia` の icon と image を通信なしの固定素材で比較する。 */
export const MediaVariants: Story = {
  render: ({ orientation, size, state }) => (
    <ul className="flex flex-wrap items-start gap-6" aria-label="AttachmentMedia の全 variant">
      {mediaVariantOptions.map((mediaVariant) => {
        // image variant だけに具体的な代替テキストを与え、装飾 icon との読み上げを重複させない。
        const copy =
          mediaVariant === 'image'
            ? {
                title: 'image.png',
                description: '640 KB',
                imageAlt: 'image.png の固定プレビュー',
              }
            : standardCopy;

        return (
          <li key={mediaVariant} className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">{mediaVariant}</span>
            <AttachmentPreview
              rootProps={{ orientation, size, state }}
              copy={copy}
              mediaVariant={mediaVariant}
            />
          </li>
        );
      })}
    </ul>
  ),
};

/**
 * `AttachmentGroup` に状態の異なる固定項目を並べ、横スクロールと snap の親子契約を確認する。
 * list semantics を明示し、個々の Attachment を読み上げ上も独立した項目として扱う。
 */
export const Group: Story = {
  render: ({ size }) => (
    <AttachmentGroup
      role="list"
      aria-label="添付ファイル一覧"
      tabIndex={0}
      className="w-full max-w-lg focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {/* scroll container 自体を focusable にし、キーボードでも横スクロールへ到達できるようにする。 */}
      {groupItems.map(({ state, copy }) => (
        <AttachmentPreview
          key={copy.title}
          rootProps={{ orientation: 'horizontal', role: 'listitem', size, state }}
          copy={copy}
        />
      ))}
    </AttachmentGroup>
  ),
};
