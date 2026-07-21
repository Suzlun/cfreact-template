import { expect, within } from 'storybook/test';

import { SafeHTML } from '@cfreact-template/ui/SafeHTML';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 通常のリッチテキストを、外部データや実在サービスへ依存しない固定文字列で表す。
 * 見出し、段落、強調、引用が既定の許可タグとして保持されることを確認する入力である。
 */
const ordinaryRichTextHtml = `
  <h2>ローカル文書の概要</h2>
  <p>この本文は Story 内で完結する固定の HTML 文字列です。</p>
  <p><strong>重要な語句</strong>を保ちながら、<em>補足のニュアンス</em>も表現します。</p>
  <blockquote>引用文も安全な構造としてそのまま読み取れます。</blockquote>
`;

/**
 * 既定設定が許可するリンク、リスト、コード、文字装飾を一つの固定文書へ集約する。
 * リンクはクリックせず、HTTP 通信を発生させない `mailto:` の保持だけを DOM で検証する。
 */
const allowedRichContentHtml = `
  <h2>許可されたリッチコンテンツ</h2>
  <p><a href="mailto:storybook@example.invalid" title="固定の連絡先">固定の連絡先</a>を文中に含めます。</p>
  <ul>
    <li>順序なし項目 A</li>
    <li>順序なし項目 B</li>
  </ul>
  <ol>
    <li>最初の手順</li>
    <li>次の手順</li>
  </ol>
  <pre><code class="language-typescript">const answer = 42;</code></pre>
  <p><strong>太字</strong>、<em>斜体</em>、<u>下線</u>、<mark>マーク</mark>、<del>削除表現</del>を保持します。</p>
`;

/**
 * script、イベントハンドラー、`javascript:` URL を同時に含む攻撃入力を固定文字列で表す。
 * Story は入力を操作せず、サニタイズ後の DOM だけを読み取るため、埋め込んだ処理は実行されない。
 */
const maliciousHtml = `
  <p id="retained-safe-content">サニタイズ後も残る安全な本文です。</p>
  <script>document.body.dataset.safeHtmlScript = 'executed'</script>
  <button onclick="document.body.dataset.safeHtmlClick = 'executed'" onpointerenter="document.body.dataset.safeHtmlPointer = 'executed'">属性が除去されるボタン</button>
  <a href="javascript:document.body.dataset.safeHtmlUrl = 'executed'">URL が除去されるリンク</a>
`;

/**
 * 閉じタグが不足した段落、強調、リストを含む固定 HTML を表す。
 * ブラウザーと DOMPurify が構造を補正しても、安全な可視テキストが失われないことを確認する。
 */
const malformedHtml =
  '<p>閉じタグが不足した段落<strong>修復後も残る強調</p><ul><li>項目 A<li>項目 B</ul>';

/** SafeHTML が空文字を受け取る公開契約を、値の変換を挟まずそのまま確認する入力。 */
const emptyHtml = '';

/**
 * 狭い領域でも折り返しを確認できる、空白や区切りを持たない固定の長文トークン。
 * 生成処理やリモート取得を使わないため、すべての実行で同じ DOM と寸法条件を再現する。
 */
const longUnbrokenToken =
  'localcontentidentifierwithoutseparators0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** 長い非分割トークンを通常の段落内へ配置する、完全にローカルな固定 HTML。 */
const longUnbrokenHtml = `<p>長い識別子: <code>${longUnbrokenToken}</code></p>`;

/**
 * SafeHTML の `className` 公開 API へ渡す、Story 共通のリッチテキスト表示規則。
 * 色、余白、角丸は既存 token と Tailwind utility だけを使い、入力 HTML 自体へ装飾責務を持たせない。
 */
const richTextClassName =
  'min-w-0 max-w-prose space-y-4 break-words text-sm leading-6 text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_mark]:bg-accent [&_mark]:text-accent-foreground';

/**
 * 長い非分割文字列専用に、公開 `className` API から応答的な幅と折り返しを指定する。
 * `max-w-sm` は検証領域を意図的に狭め、`max-w-full` はさらに狭い canvas からのはみ出しを防ぐ。
 */
const responsiveContentClassName =
  'w-full min-w-0 max-w-full break-words text-sm leading-6 text-foreground sm:max-w-sm [&_code]:font-mono';

/**
 * 名前付き Story 領域の直下から SafeHTML が描画した root 要素を取得する。
 *
 * @param region SafeHTML を直接一つだけ含む、アクセシブル名付きの Story 専用領域。
 * @returns `className` とサニタイズ済み HTML を保持する SafeHTML の root `div`。
 * @throws 期待する公開描画構造が存在せず、DOM assertion を継続できない場合に `TypeError` を送出する。
 *
 * @example
 * const output = getSafeHtmlOutput(canvas.getByRole('region', { name: 'SafeHTML 出力' }));
 */
function getSafeHtmlOutput(region: HTMLElement): HTMLElement {
  // 見出しなど Story 側の説明要素を誤取得せず、region 直下の SafeHTML root だけを対象にする。
  const output = region.querySelector(':scope > div');

  if (!(output instanceof HTMLElement)) {
    // root がない状態を成功扱いにせず、以降の安全性検証を明示的に停止する。
    throw new TypeError('SafeHTML の root 要素を取得できませんでした。');
  }

  return output;
}

/**
 * SafeHTML の公開 props と固定例を CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * HTML と設定の Controls は無効化し、すべての Story がレビュー済みのローカル文字列だけを描画する。
 * `sanitizeOptions` は指定時に既定設定を置き換える実契約として説明し、Story から変更や通信を行わない。
 *
 * @example
 * Storybook の `UI/Components/SafeHTML` から各入力とサニタイズ結果を確認する。
 */
const meta = {
  title: 'Components/SafeHTML',
  component: SafeHTML,
  args: {
    html: ordinaryRichTextHtml,
    className: richTextClassName,
  },
  argTypes: {
    html: {
      control: false,
      description: 'サニタイズして描画する固定 HTML 文字列。',
    },
    className: {
      control: false,
      description: 'サニタイズ済み HTML を持つ root `div` へ適用する既存 class 名。',
    },
    sanitizeOptions: {
      control: false,
      description: '指定時に SafeHTML の既定設定を置き換える DOMPurify 設定。',
    },
  },
  parameters: {
    layout: 'padded',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'DOMPurify で固定 HTML をサニタイズして描画する SafeHTML。許可される文書構造、危険な要素・属性・URL の除去、壊れた入力、空入力、長文の折り返しを、外部通信やスクリプト実行なしで確認できます。',
      },
    },
  },
  render: (args) => (
    <section aria-label="SafeHTML 出力" className="w-full min-w-0">
      {/* Story の領域だけを追加し、描画内容とサニタイズ処理は公開 component へそのまま委譲する。 */}
      <SafeHTML {...args} />
    </section>
  ),
} satisfies Meta<typeof SafeHTML>;

/**
 * Storybook が SafeHTML catalog の型、Docs、a11y、browser tests を構築するための既定 export。
 * 宣言値の公開だけを行い、実行時の通信、永続化、スクリプト実行は発生させない。
 */
export default meta;

/** SafeHTML の CSF 3 Story 定義を、上記 meta の公開 props から導出する型。 */
type Story = StoryObj<typeof meta>;

/**
 * 一般的な見出し、段落、強調、引用を含む固定リッチテキストを描画する。
 * play では安全な要素と可視テキストがサニタイズ後も保持されることを DOM から確認する。
 */
export const OrdinaryRichText: Story = {
  play: async ({ canvasElement, step }) => {
    // Storybook の操作 UI を含めず、対象 canvas 内だけから安全な要素を検索する。
    const canvas = within(canvasElement);

    await step('通常の文書構造と文字装飾を保持する', async () => {
      await expect(
        canvas.getByRole('heading', { level: 2, name: 'ローカル文書の概要' })
      ).toBeVisible();
      await expect(
        canvas.getByText('この本文は Story 内で完結する固定の HTML 文字列です。')
      ).toBeVisible();
      await expect(canvas.getByText('重要な語句', { selector: 'strong' })).toBeVisible();
      await expect(canvas.getByText('補足のニュアンス', { selector: 'em' })).toBeVisible();
      await expect(
        canvas.getByText('引用文も安全な構造としてそのまま読み取れます。')
      ).toBeVisible();
    });
  },
};

/**
 * 既定設定で許可されるリンク、二種類のリスト、コード、文字装飾をまとめて描画する。
 * リンクをクリックせず、許可 URI と属性、意味要素が DOM に残ることだけを検証する。
 */
export const AllowedLinksListsCodeAndFormatting: Story = {
  args: {
    html: allowedRichContentHtml,
  },
  play: async ({ canvasElement, step }) => {
    // 固定 HTML から生成された canvas 内だけを検証し、リンク操作や外部遷移は行わない。
    const canvas = within(canvasElement);

    await step('許可されたリンクと文書要素を保持する', async () => {
      const link = canvas.getByRole('link', { name: '固定の連絡先' });
      const code = canvas.getByText('const answer = 42;', { selector: 'code' });

      await expect(link).toHaveAttribute('href', 'mailto:storybook@example.invalid');
      await expect(link).toHaveAttribute('title', '固定の連絡先');
      await expect(canvas.getAllByRole('list')).toHaveLength(2);
      await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
      await expect(code).toHaveClass('language-typescript');
      await expect(canvas.getByText('太字', { selector: 'strong' })).toBeVisible();
      await expect(canvas.getByText('斜体', { selector: 'em' })).toBeVisible();
      await expect(canvas.getByText('下線', { selector: 'u' })).toBeVisible();
      await expect(canvas.getByText('マーク', { selector: 'mark' })).toBeVisible();
      await expect(canvas.getByText('削除表現', { selector: 'del' })).toBeVisible();
    });
  },
};

/**
 * script、イベントハンドラー、`javascript:` URL を含む固定攻撃入力を描画する。
 * play は安全な本文と許可タグが残り、危険な node・属性・URL が存在しないことを操作なしで証明する。
 */
export const SanitizesMaliciousContent: Story = {
  args: {
    html: maliciousHtml,
  },
  play: async ({ canvasElement, step }) => {
    // 名前付き region 直下から SafeHTML root を取得し、Story wrapper を安全性検査へ混在させない。
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'SafeHTML 出力' });
    const output = getSafeHtmlOutput(region);
    const outputCanvas = within(output);

    await step('安全な本文と許可タグを保持する', async () => {
      await expect(outputCanvas.getByText('サニタイズ後も残る安全な本文です。')).toBeVisible();
      await expect(
        outputCanvas.getByRole('button', { name: '属性が除去されるボタン' })
      ).toBeVisible();
      await expect(
        outputCanvas.getByText('URL が除去されるリンク', { selector: 'a' })
      ).toBeVisible();
    });

    await step('危険な node、イベント属性、URL を完全に除去する', async () => {
      const button = outputCanvas.getByRole('button', { name: '属性が除去されるボタン' });
      const sanitizedAnchor = outputCanvas.getByText('URL が除去されるリンク', {
        selector: 'a',
      });

      await expect(output.querySelector('script')).toBeNull();
      await expect(output.querySelector('[onclick]')).toBeNull();
      await expect(output.querySelector('[onpointerenter]')).toBeNull();
      await expect(output.querySelector('[href^="javascript:"]')).toBeNull();
      await expect(button).not.toHaveAttribute('onclick');
      await expect(button).not.toHaveAttribute('onpointerenter');
      await expect(sanitizedAnchor).not.toHaveAttribute('href');
      await expect(canvasElement.ownerDocument.body).not.toHaveAttribute('data-safe-html-script');
      await expect(canvasElement.ownerDocument.body).not.toHaveAttribute('data-safe-html-click');
      await expect(canvasElement.ownerDocument.body).not.toHaveAttribute('data-safe-html-pointer');
      await expect(canvasElement.ownerDocument.body).not.toHaveAttribute('data-safe-html-url');
    });
  },
};

/**
 * 閉じタグが不足した HTML と空文字を同じ Story で分離して描画する。
 * play は補正された安全な内容が残ることと、空入力の root に不要な node が生成されないことを確認する。
 */
export const MalformedAndEmptyContent: Story = {
  render: () => (
    <div className="grid gap-8">
      <section aria-labelledby="malformed-content-title" className="min-w-0 space-y-3">
        <h2 id="malformed-content-title" className="text-sm font-semibold">
          閉じタグが不足した入力
        </h2>
        {/* 不正な構造を事前修正せず渡し、SafeHTML の実際のサニタイズ結果を確認する。 */}
        <SafeHTML html={malformedHtml} className={richTextClassName} />
      </section>

      <section aria-labelledby="empty-content-title" className="min-w-0 space-y-3">
        <h2 id="empty-content-title" className="text-sm font-semibold">
          空文字の入力
        </h2>
        {/* 空文字を placeholder へ置換せず、公開契約どおり空の root を描画する。 */}
        <SafeHTML html={emptyHtml} className={richTextClassName} />
      </section>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 二つの入力をアクセシブル名で分離し、各 SafeHTML root を個別に取得する。
    const canvas = within(canvasElement);
    const malformedRegion = canvas.getByRole('region', {
      name: '閉じタグが不足した入力',
    });
    const emptyRegion = canvas.getByRole('region', { name: '空文字の入力' });
    const malformedOutput = getSafeHtmlOutput(malformedRegion);
    const emptyOutput = getSafeHtmlOutput(emptyRegion);

    await step('壊れた構造を補正しながら安全な内容を保持する', async () => {
      const malformedCanvas = within(malformedOutput);

      await expect(malformedCanvas.getByText('閉じタグが不足した段落')).toBeVisible();
      await expect(
        malformedCanvas.getByText('修復後も残る強調', { selector: 'strong' })
      ).toBeVisible();
      await expect(malformedCanvas.getAllByRole('listitem')).toHaveLength(2);
      await expect(malformedOutput.querySelector('script')).toBeNull();
    });

    await step('空文字から追加の内容を生成しない', async () => {
      await expect(emptyOutput).toBeEmptyDOMElement();
      await expect(emptyOutput.querySelectorAll('*')).toHaveLength(0);
    });
  },
};

/**
 * 空白を持たない長い固定トークンを、公開 `className` API による応答的な幅と折り返しで描画する。
 * play は狭い既存寸法内でも内容が保持され、root の横幅を超えてスクロールしないことを実ブラウザーで確認する。
 */
export const LongUnbrokenResponsiveContent: Story = {
  args: {
    html: longUnbrokenHtml,
    className: responsiveContentClassName,
  },
  play: async ({ canvasElement, step }) => {
    // SafeHTML root と長文 code を別々に取得し、文字保持と layout の両契約を検証する。
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'SafeHTML 出力' });
    const output = getSafeHtmlOutput(region);
    const token = within(output).getByText(longUnbrokenToken, { selector: 'code' });

    await step('長い非分割文字列を欠落させず保持する', async () => {
      await expect(token).toBeVisible();
      await expect(token).toHaveTextContent(longUnbrokenToken);
    });

    await step('狭い応答的な領域から横方向へはみ出さない', async () => {
      await expect(output).toHaveClass('max-w-full', 'break-words', 'sm:max-w-sm');
      await expect(getComputedStyle(output).overflowWrap).toBe('break-word');
      await expect(output.clientWidth).toBeGreaterThan(0);
      await expect(output.scrollWidth).toBeLessThanOrEqual(output.clientWidth);
    });
  },
};
