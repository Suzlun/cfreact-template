import { EmailMessage } from 'cloudflare:email';

import type { Bindings, EmailPayload } from '@cfreact-template/backend/types';

const mailboxLocalPartPattern =
  /^[A-Za-z\d!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z\d!#$%&'*+/=?^_`{|}~-]+)*$/u;
const mailboxDomainPattern =
  /^(?=.{1,253}$)[A-Za-z\d](?:[A-Za-z\d-]{0,61}[A-Za-z\d])?(?:\.[A-Za-z\d](?:[A-Za-z\d-]{0,61}[A-Za-z\d])?)+$/u;

/**
 * `Cloudflare Email Workers` バインディングへメールを転送する具体実装。
 *
 * @remarks
 * 業務モジュールの型や本文の意味を知らず、渡された一般的なメール送信内容だけを送信する。
 * 送信時にヘッダーを検査し、`Cloudflare Email Workers` バインディングへ一件のメールを渡す。
 *
 * @example
 * ```ts
 * const sender = new CloudflareEmailSender(bindings.EMAIL);
 * await sender.send(message);
 * ```
 */
export class CloudflareEmailSender {
  /**
   * メールバインディングを受け取って送信器を構築する。
   *
   * @remarks
   * 構築時にはメールを送信せず、通常は例外を送出しない。
   *
   * @param emailBinding `Cloudflare Email Workers` バインディング。
   */
  constructor(private readonly emailBinding: Bindings['EMAIL']) {}

  /**
   * text/plain メールを Cloudflare へ送信する。
   *
   * @remarks
   * 安全な MIME ヘッダー、送信時刻、`Message-ID` を生成し、`Cloudflare Email Workers` バインディングへメールを送信する。
   *
   * @param message 送信元、宛先、件名、本文を含むメール内容。
   * @returns Cloudflare が送信を受理した時点で完了する非同期処理。
   * @throws ヘッダー値が空か制御文字を含む場合、送信元・宛先が単一メールボックスとして不正な場合、
   * または Cloudflare が送信に失敗した場合。
   *
   * @example
   * ```ts
   * await sender.send({
   *   from: 'sender@example.com',
   *   to: 'recipient@example.com',
   *   subject: 'User created',
   *   text: 'A user was created.',
   * });
   * ```
   */
  async send(message: EmailPayload): Promise<void> {
    // 送信元と宛先を単一メールボックスへ限定し、件名は Unicode を保持したまま制御文字だけを拒否する。
    const from = validateMailbox(message.from, 'from');
    const to = validateMailbox(message.to, 'to');
    const subject = validateHeader(message.subject, 'subject');

    // `Cloudflare Workers` の標準 API で送信時刻と一意な識別子を生成し、`Cloudflare` が受理できるメール形式にする。
    const date = new Date().toUTCString();
    const messageId = `<${crypto.randomUUID()}@${from.domain}>`;

    // 固定値を含むすべてのヘッダー値を同じ境界で検査し、本文の前に安全な一行として配置する。
    const headers = [
      ['From', `<${from.address}>`],
      ['To', `<${to.address}>`],
      ['Subject', subject],
      ['Date', date],
      ['Message-ID', messageId],
      ['MIME-Version', '1.0'],
      ['Content-Type', 'text/plain; charset=utf-8'],
    ] as const;

    // 業務モジュールが組み立てた本文を `text/plain` として RFC 形式へ包み、バインディングへ渡す。
    const rawMessage = [
      ...headers.map(([name, value]) => `${name}: ${validateHeader(value, name)}`),
      '',
      message.text,
    ].join('\r\n');

    await this.emailBinding.send(new EmailMessage(from.address, to.address, rawMessage));
  }
}

/**
 * MIME ヘッダーへ入れる値が空でなく、制御文字を含まないことを確認する。
 *
 * @param value 検査対象の設定値。
 * @param field エラー記録に使う項目名。
 * @returns Unicode を含む元の値を変更せず返す。
 * @throws 空文字列、空白だけの値、ASCII または C1 制御文字を含む値が渡された場合。
 */
const validateHeader = (value: string, field: string): string => {
  // 改行だけでなく NUL、タブ、DEL、C1 を含む全制御文字を、位置を問わず拒否する。
  if (hasHeaderControlCharacter(value)) {
    throw new Error(`Invalid email ${field} configuration`);
  }

  // Unicode 件名は保持しつつ、空文字列と空白だけの値は有効なヘッダーとして扱わない。
  if (value.trim() === '') {
    throw new Error(`Invalid email ${field} configuration`);
  }

  return value;
};

/**
 * ヘッダー値に ASCII または C1 制御文字が含まれるか確認する。
 *
 * @param value 検査対象のヘッダー値。
 * @returns U+0000-U+001F または U+007F-U+009F を一文字でも含む場合は true。
 */
const hasHeaderControlCharacter = (value: string): boolean => {
  // Unicode の表示文字を変更せず、ヘッダー構文へ影響する二つの制御文字範囲だけを文字コードで判定する。
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      return true;
    }
  }

  return false;
};

/**
 * 設定値を単一の保守的なメールボックスとして検証する。
 *
 * @param value 検査対象の送信元または宛先。
 * @param field エラー記録に使う項目名。
 * @returns 検証済みメールアドレスと、Message-ID に利用できる小文字ドメイン。
 * @throws 制御文字、空白、表示名、アドレス一覧、または不正なローカル部・ドメインを含む場合。
 */
const validateMailbox = (value: string, field: string): { address: string; domain: string } => {
  // すべてのメールヘッダーに共通する空値と制御文字の検査を先に適用する。
  const address = validateHeader(value, field);

  // 表示名、山括弧、一覧区切り、前後を含む空白を拒否し、一件の裸のメールボックスだけを受理する。
  if (/[\s,<>]/u.test(address) || address !== address.trim() || address.length > 254) {
    throw new Error(`Invalid email ${field} configuration`);
  }

  // @ を一つだけ許可し、ローカル部とドメインを個別の保守的な ASCII 構文で検証する。
  const separatorIndex = address.indexOf('@');
  if (separatorIndex <= 0 || separatorIndex !== address.lastIndexOf('@')) {
    throw new Error(`Invalid email ${field} configuration`);
  }
  const localPart = address.slice(0, separatorIndex);
  const domain = address.slice(separatorIndex + 1);
  if (
    localPart.length > 64 ||
    !mailboxLocalPartPattern.test(localPart) ||
    !mailboxDomainPattern.test(domain)
  ) {
    throw new Error(`Invalid email ${field} configuration`);
  }

  // Message-ID は、この検証を通過した送信元のドメインだけから組み立てられるよう同時に返す。
  return { address, domain: domain.toLowerCase() };
};
