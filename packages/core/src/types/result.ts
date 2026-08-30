/**
 * 予期される成功または失敗を、例外へ変換せずに表す判別可能な結果。
 *
 * @typeParam T 成功時に返す値の型。
 * @typeParam E 失敗時に返す閉じた失敗型。
 * @remarks
 * 型定義なので実行時の戻り値、例外、副作用はない。呼び出し元は `ok` で成功値と失敗値を判別する。
 *
 * @example
 * ```ts
 * const result: Result<string, { kind: 'missing' }> = {
 *   ok: false,
 *   error: { kind: 'missing' },
 * };
 * ```
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * APIへ返せない内部原因を、サーバー側の観測記録へ渡す関数。
 *
 * @remarks
 * 実装は記録の副作用を持ち得る。戻り値はなく、例外を送出するかどうかは注入する実装の契約に従う。
 *
 * @param event 失敗の分類を表す固定イベント名。
 * @param cause 外部へ公開せずに記録する未知の原因。
 * @returns なし。呼び出し元は原因をAPI応答へ含めてはならない。
 *
 * @example
 * ```ts
 * const log: FailureLogger = (event, cause) => console.error(event, cause);
 * ```
 */
export type FailureLogger = (event: string, cause: unknown) => void;
