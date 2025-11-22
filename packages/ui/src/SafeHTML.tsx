import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';

export interface SafeHTMLProps {
  /** サニタイズするHTML文字列 */
  html: string;
  /** 追加のクラス名 */
  className?: string;
  /** カスタムサニタイズ設定（オプション） */
  sanitizeOptions?: DOMPurifyConfig;
}

/**
 * DOMPurify でサニタイズした HTML を安全にレンダリングするコンポーネント
 *
 * @example
 * ```tsx
 * // マークダウンからHTML
 * <SafeHTML html={marked.parse(markdown)} />
 *
 * // APIから取得したコンテンツ
 * <SafeHTML html={apiContent} />
 *
 * // カスタムサニタイズ設定
 * <SafeHTML
 *   html={richText}
 *   sanitizeOptions={{ ALLOWED_TAGS: ['p', 'strong', 'em'] }}
 * />
 * ```
 */
export function SafeHTML({ html, className, sanitizeOptions }: SafeHTMLProps) {
  const defaultConfig: DOMPurifyConfig = {
    // 標準設定: 一般的なHTMLタグを許可
    ALLOWED_TAGS: [
      // テキスト構造
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'pre',
      'code',
      // テキスト装飾
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'del',
      'ins',
      'mark',
      'small',
      'sub',
      'sup',
      // リスト
      'ul',
      'ol',
      'li',
      // リンク
      'a',
      // テーブル
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      // 画像
      'img',
      // その他
      'hr',
      'span',
      'div',
    ],
    ALLOWED_ATTR: [
      // 一般的な属性
      'class',
      'id',
      // リンク
      'href',
      'title',
      'target',
      'rel',
      // 画像
      'src',
      'alt',
      'width',
      'height',
      // テーブル
      'colspan',
      'rowspan',
      // コード（構文ハイライト用）
      'data-language',
    ],
    // リンクのプロトコル制限
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[+.a-z-]+(?:[^+.:a-z-]|$))/i,
    // data属性は禁止（セキュリティリスク）
    ALLOW_DATA_ATTR: false,
    // 安全でないスキームを削除
    SANITIZE_DOM: true,
    // HTMLコメントを削除
    ALLOW_UNKNOWN_PROTOCOLS: false,
  };

  const config: DOMPurifyConfig = sanitizeOptions ?? defaultConfig;
  const sanitized: unknown = DOMPurify.sanitize(html, config);
  const sanitizedHTML = typeof sanitized === 'string' ? sanitized : String(sanitized);

  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger -- DOMPurify でサニタイズ済み
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}
