import {
  CopyIcon,
  FileCodeIcon,
  FileSearchIcon,
  FileTextIcon,
  FileWarningIcon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cfreact-template/ui/components/dialog';
import { Spinner } from '@cfreact-template/ui/components/spinner';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 狭い mobile canvas でも左右の余白を保ち、desktop では添付一覧を読みやすい幅に制限する。 */
const storySurfaceClassName = 'w-[calc(100vw-2rem)] max-w-lg min-w-0';

/** 公式 Trigger 例の描画、操作名、interaction assertion で共有する添付ファイル名。 */
const previewFilename = 'research-summary.pdf';

/** 公式 Trigger 例の dialog が、全面 trigger と独立 action の関係を説明する本文。 */
const previewDialogDescription =
  'The attachment trigger fills the card and opens the dialog, while the actions stay independently clickable above it.';

/** 公式 shadcn の画像例から、表示名・metadata・代替テキスト・画像 URL を一組で保持する。 */
interface ImageAttachmentExample {
  /** 画像内容を簡潔に伝える、公式例と同じ代替テキスト。 */
  alt: string;
  /** ファイル形式と容量を表す、公式例と同じ metadata。 */
  description: string;
  /** shadcn 公式例が直接参照する Unsplash 画像 URL。 */
  src: string;
  /** 添付ファイル名として表示する、公式例と同じ title。 */
  title: string;
}

/** 公式 shadcn の Image 例で使われる実画像とコピーだけを Story の固定データにする。 */
const imageAttachments: readonly ImageAttachmentExample[] = [
  {
    alt: 'Workspace',
    description: 'PNG · 820 KB',
    src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&auto=format&fit=crop&q=80',
    title: 'workspace.png',
  },
  {
    alt: 'Desk',
    description: 'JPG · 1.1 MB',
    src: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&auto=format&fit=crop&q=80',
    title: 'desk-reference.jpg',
  },
  {
    alt: 'Office',
    description: 'JPG · 940 KB',
    src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&auto=format&fit=crop&q=80',
    title: 'office-reference.jpg',
  },
];

/** Story 内の削除、再試行、copy 操作を外部作用なしで Interactions から観測する。 */
const removeAttachment = fn();
const retryUpload = fn();
const copyPreviewAttachment = fn();
const removePreviewAttachment = fn();

/**
 * icon-only の削除操作へ対象ファイルを含む名前を付け、公式の action 構成を共用する。
 *
 * @param props 削除対象として通知し、アクセシブル名にも含めるファイル名。
 * @returns 独立して focus・click できる `AttachmentAction` を含む actions 領域。
 */
function RemoveAttachmentAction({ filename }: { filename: string }) {
  return (
    <AttachmentActions>
      <AttachmentAction
        aria-label={`Remove ${filename}`}
        onClick={() => {
          // Story 外のデータを変更せず、どの添付への操作かを Interactions へ記録する。
          removeAttachment(filename);
        }}
      >
        <XIcon aria-hidden="true" />
      </AttachmentAction>
    </AttachmentActions>
  );
}

/**
 * 公式 Image 例の vertical attachment を、画像 link と独立した削除 action 付きで描画する。
 *
 * @param props 公式例の画像 URL、代替テキスト、ファイル名、metadata。
 * @returns `AttachmentGroup` の一項目として利用できる画像 attachment。
 */
function ImageAttachment({ image }: { image: ImageAttachmentExample }) {
  return (
    <Attachment orientation="vertical" role="listitem">
      <AttachmentMedia variant="image">
        {/* 公式例と同じ実画像を使用し、通信失敗時にも内容が分かる代替テキストを残す。 */}
        <img src={image.src} alt={image.alt} width={900} height={600} />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{image.title}</AttachmentTitle>
        <AttachmentDescription>{image.description}</AttachmentDescription>
      </AttachmentContent>
      <RemoveAttachmentAction filename={image.title} />
      {/* 全面 trigger は公式例と同じ画像 URL を新規 tab で開き、削除 action の操作領域と分離する。 */}
      <AttachmentTrigger
        render={
          <a href={image.src} target="_blank" rel="noreferrer" aria-label={`Open ${image.title}`} />
        }
      />
    </Attachment>
  );
}

/**
 * Attachment の公式用途と既存 subcomponent を Storybook Docs に登録する。
 * API 一覧ではなく、chat attachment、upload list、preview interaction の実例を入口にする。
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
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Displays a file or image attachment with media, metadata, upload state, and actions. Use it for files and images in chat composers, message threads, and upload lists.',
      },
    },
  },
} satisfies Meta<typeof Attachment>;

/** Storybook が Attachment catalog の Docs と theme・viewport 検証を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * shadcn の主例と AI Elements の grid 例に沿い、画像・upload 中ファイル・code を一つの添付列に置く。
 * group 自体は 390px で横スクロールし、各 link と action は keyboard で個別に到達できる。
 */
export const MessageAttachments: Story = {
  render: () => (
    <section className={storySurfaceClassName} aria-labelledby="message-attachments-title">
      <h2 id="message-attachments-title" className="mb-3 text-sm font-medium">
        Attachments
      </h2>
      <AttachmentGroup role="list" aria-labelledby="message-attachments-title" className="w-full">
        {/* 画像は公式 Image 例の順序・copy・URL を維持し、message 添付として横一列にまとめる。 */}
        {imageAttachments.map((image) => (
          <ImageAttachment key={image.title} image={image} />
        ))}

        {/* 公式主例の upload 状態を、同じ group 内で進行中の実ファイルとして示す。 */}
        <Attachment state="uploading" role="listitem" className="w-52">
          <AttachmentMedia>
            <Spinner aria-label="Uploading sales-dashboard.pdf" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
            <AttachmentDescription>Uploading · 64%</AttachmentDescription>
          </AttachmentContent>
          <RemoveAttachmentAction filename="sales-dashboard.pdf" />
        </Attachment>

        {/* 公式主例の code file を通常完了状態で置き、画像以外も同じ component で扱えることを示す。 */}
        <Attachment role="listitem" className="w-52">
          <AttachmentMedia>
            <FileCodeIcon aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>message-renderer.tsx</AttachmentTitle>
            <AttachmentDescription>TypeScript · 12 KB</AttachmentDescription>
          </AttachmentContent>
          <RemoveAttachmentAction filename="message-renderer.tsx" />
        </Attachment>
      </AttachmentGroup>
    </section>
  ),
};

/**
 * 公式 lifecycle 例から、同時に起こり得る upload・processing・error を実際の upload list として示す。
 * 状態名の比較 label は追加せず、file icon、status copy、retry action から状況を理解できる構成にする。
 */
export const UploadQueue: Story = {
  render: () => (
    <section className={`${storySurfaceClassName} space-y-3`} aria-labelledby="uploads-title">
      <h2 id="uploads-title" className="text-sm font-medium">
        Uploads
      </h2>
      <div role="list" aria-labelledby="uploads-title" className="space-y-2">
        {/* transfer 中は公式 Spinner と進捗率を併用し、色や animation だけに依存せず状態を伝える。 */}
        <Attachment state="uploading" role="listitem" className="w-full">
          <AttachmentMedia>
            <Spinner aria-label="Uploading design-system.zip" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>design-system.zip</AttachmentTitle>
            <AttachmentDescription>Uploading · 64%</AttachmentDescription>
          </AttachmentContent>
          <RemoveAttachmentAction filename="design-system.zip" />
        </Attachment>

        {/* processing は公式例どおり document icon と明示的な状態文を使い、shimmer を補助表現に留める。 */}
        <Attachment state="processing" role="listitem" className="w-full">
          <AttachmentMedia>
            <FileTextIcon aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>market-research.pdf</AttachmentTitle>
            <AttachmentDescription>Processing document</AttachmentDescription>
          </AttachmentContent>
          <RemoveAttachmentAction filename="market-research.pdf" />
        </Attachment>

        {/* error は理由を本文へ残し、公式例と同じ retry・remove の recovery 操作を分離して提供する。 */}
        <Attachment state="error" role="listitem" className="w-full">
          <AttachmentMedia>
            <FileWarningIcon aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>financial-model.xlsx</AttachmentTitle>
            <AttachmentDescription className="text-destructive!">
              Upload failed. Try again.
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label="Retry financial-model.xlsx"
              onClick={() => {
                // recovery 操作の対象を Interactions へ通知し、Story 内では error 表示を安定して維持する。
                retryUpload('financial-model.xlsx');
              }}
            >
              <RefreshCwIcon aria-hidden="true" />
            </AttachmentAction>
            <AttachmentAction
              aria-label="Remove financial-model.xlsx"
              onClick={() => {
                // retry と別の操作として削除対象を記録し、icon-only action の用途を明確に保つ。
                removeAttachment('financial-model.xlsx');
              }}
            >
              <XIcon aria-hidden="true" />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    </section>
  ),
};

/**
 * 公式 Trigger 例どおり、card 全面で preview dialog を開きながら copy・remove を独立操作にする。
 * play は stacking order、アクセシブル名、focus restoration を利用者と同じ操作で確認する。
 */
export const PreviewAndActions: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-sm py-12">
      <Dialog>
        <Attachment className="w-full">
          <AttachmentMedia>
            <FileSearchIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{previewFilename}</AttachmentTitle>
            <AttachmentDescription>Open preview dialog</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label="Copy link"
              onClick={() => {
                // 公式例の可視構成を変えず、copy action が trigger と独立して呼ばれた事実だけを記録する。
                copyPreviewAttachment(previewFilename);
              }}
            >
              <CopyIcon />
            </AttachmentAction>
            <AttachmentAction
              aria-label={`Remove ${previewFilename}`}
              onClick={() => {
                // preview を開かずに削除 action だけが通知されることを play から検証可能にする。
                removePreviewAttachment(previewFilename);
              }}
            >
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
          {/* DialogTrigger が全面 button のイベントを受け持ち、actions は上位 stacking layer で独立させる。 */}
          <DialogTrigger render={<AttachmentTrigger aria-label={`Preview ${previewFilename}`} />} />
        </Attachment>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{previewFilename}</DialogTitle>
            <DialogDescription>{previewDialogDescription}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // theme・viewport ごとの再実行前に、この Story の操作履歴だけを検証できる状態へ戻す。
    copyPreviewAttachment.mockClear();
    removePreviewAttachment.mockClear();

    // canvas と portal を分けて検索し、Storybook chrome の button や dialog を誤取得しない。
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const copyAction = canvas.getByRole('button', { name: 'Copy link' });
    const removeAction = canvas.getByRole('button', { name: `Remove ${previewFilename}` });
    const previewTrigger = canvas.getByRole('button', { name: `Preview ${previewFilename}` });

    await step('actions remain independent from the full-card preview trigger', async () => {
      // 二つの icon-only action を実際に操作し、dialog が副作用で開かないことを確認する。
      await userEvent.click(copyAction);
      await userEvent.click(removeAction);
      await expect(copyPreviewAttachment).toHaveBeenCalledWith(previewFilename);
      await expect(removePreviewAttachment).toHaveBeenCalledWith(previewFilename);
      await expect(page.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await step('the labeled trigger opens the dialog and restores focus on close', async () => {
      // 全面 trigger から portal dialog を開き、公式例の title と説明が意味構造として存在することを確認する。
      await userEvent.click(previewTrigger);
      const dialog = await page.findByRole('dialog');
      await expect(
        within(dialog).getByRole('heading', { name: previewFilename })
      ).toBeInTheDocument();
      await expect(within(dialog).getByText(previewDialogDescription)).toBeInTheDocument();

      // Escape で閉じた後に trigger へ focus が戻るまで待ち、keyboard の操作連続性を保証する。
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(page.queryByRole('dialog')).not.toBeInTheDocument());
      await waitFor(() => expect(previewTrigger).toHaveFocus());
    });
  },
};
