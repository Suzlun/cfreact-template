/**
 * 外部メール基盤へ渡す、ユーザー情報に依存しないメール内容。
 *
 * @remarks
 * 件名と本文の組み立ては利用する業務モジュールが担い、メール基盤はこの値を送信するだけである。
 * データ型なので実行時の戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const message: EmailPayload = {
 *   from: 'sender@example.com',
 *   to: 'recipient@example.com',
 *   subject: 'User created',
 *   text: 'A user was created.',
 * };
 * ```
 */
export interface EmailPayload {
  /** RFC 5322 の送信元アドレス。 */
  from: string;
  /** RFC 5322 の宛先アドレス。 */
  to: string;
  /** メールの件名。 */
  subject: string;
  /** text/plain として送信する本文。 */
  text: string;
}
