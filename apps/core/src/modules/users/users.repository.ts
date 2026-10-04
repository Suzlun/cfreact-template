import { eq } from 'drizzle-orm';

import { users, type UserRow } from './users.schema';

import type { User } from './users.types';
import type { DrizzleClient } from '@cfreact-template/core/platform/database/client';
import type { Result } from '@cfreact-template/core/types';

type CreateUserRecord = Pick<User, 'id' | 'name' | 'email'>;

/**
 * 一意制約以外の永続化失敗を表す `UsersRepository` 内部エラー。
 *
 * @remarks
 * `cause` は記録専用であり、HTTP 応答へ公開しない。データ型なのでそれ自体に戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const failure: UsersRepositoryPersistenceFailure = {
 *   kind: 'persistence-failure',
 *   cause: error,
 * };
 * ```
 */
export interface UsersRepositoryPersistenceFailure {
  kind: 'persistence-failure';
  cause: unknown;
}

/**
 * メールアドレス一意制約により登録されなかったことを表す `UsersRepository` 内部エラー。
 *
 * @remarks
 * データベースの例外文を含めない閉じた失敗型である。データ型なのでそれ自体に戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const failure: UsersRepositoryEmailConflict = { kind: 'email-already-exists' };
 * ```
 */
export interface UsersRepositoryEmailConflict {
  kind: 'email-already-exists';
}

/**
 * D1 と Drizzle を使って利用者データへアクセスする永続化実装。
 *
 * @remarks
 * 一意制約の判定は SQL の `ON CONFLICT DO NOTHING` の結果で行い、DB 例外メッセージを解析しません。
 * 公開メソッドはデータベースの失敗を `Result` へ閉じ込め、通常は例外を送出しない。
 *
 * @example
 * ```ts
 * const repository = new UsersRepository(database);
 * const result = await repository.findAll();
 * ```
 */
export class UsersRepository {
  /**
   * `Drizzle` クライアントを受け取ってリポジトリを構築する。
   *
   * @remarks
   * 構築時には SQL を実行せず、通常は例外を送出しない。
   *
   * @param db ユーザーモジュールが所有するテーブルへ接続する `Drizzle` クライアント。
   */
  constructor(private readonly db: DrizzleClient) {}

  /**
   * 保存済みユーザーをすべて取得する。
   *
   * @remarks
   * D1 に SELECT を実行する。取得または行変換の失敗は例外として送出せず、内部原因付きの失敗値へ変換する。
   *
   * @returns 成功時は API 契約と同じユーザー配列、失敗時は内部原因を含む閉じた結果。
   *
   * @example
   * ```ts
   * const result = await repository.findAll();
   * ```
   */
  async findAll(): Promise<Result<User[], UsersRepositoryPersistenceFailure>> {
    try {
      // SQL の取得結果をリソース所有の API 表現へ変換し、`Drizzle` 行を上位へ漏らさない。
      const rows = await this.db.select().from(users).all();
      return { ok: true, value: rows.map((row) => this.mapRow(row)) };
    } catch (error) {
      // SQL や日時変換の詳細は呼び出し元へ公開せず、内部失敗として閉じ込める。
      return { ok: false, error: { kind: 'persistence-failure', cause: error } };
    }
  }

  /**
   * ULID でユーザーを一件取得する。
   *
   * @remarks
   * D1 に主キー SELECT を実行する。取得または行変換の失敗は例外として送出せず、内部原因付きの失敗値へ変換する。
   *
   * @param id 検索対象のユーザー ID。
   * @returns 存在すればユーザー、存在しなければ null、DB 失敗時は内部失敗。
   *
   * @example
   * ```ts
   * const result = await repository.findById('01ARZ3NDEKTSV4RRFFQ69G5FAV');
   * ```
   */
  async findById(id: User['id']): Promise<Result<User | null, UsersRepositoryPersistenceFailure>> {
    try {
      // 主キー検索を一件へ限定し、見つからない場合は業務上の未存在として null を返す。
      const row = await this.db.select().from(users).where(eq(users.id, id)).get();
      return { ok: true, value: row == null ? null : this.mapRow(row) };
    } catch (error) {
      // SQL の内部詳細を API 層へ伝えず、サービスが安全な 500 へ変換できる形にする。
      return { ok: false, error: { kind: 'persistence-failure', cause: error } };
    }
  }

  /**
   * ユーザーをメールアドレス一意制約付きで登録する。
   *
   * @remarks
   * D1 に INSERT を実行する。メール重複とその他の永続化失敗は例外として送出せず、閉じた失敗値へ変換する。
   *
   * @param input ULID と正規化済みの名前・メールアドレス。
   * @returns 作成済みユーザー、メール重複、または内部永続化失敗。
   *
   * @example
   * ```ts
   * const result = await repository.create({
   *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
   *   name: 'Ada',
   *   email: 'ada@example.com',
   * });
   * ```
   */
  async create(
    input: CreateUserRecord
  ): Promise<Result<User, UsersRepositoryPersistenceFailure | UsersRepositoryEmailConflict>> {
    try {
      // 一意制約へ処理を委ね、競合時に例外文を解析せず returning の空結果で判別する。
      const [row] = await this.db
        .insert(users)
        .values(input)
        .onConflictDoNothing({ target: users.email })
        .returning();

      if (row == null) {
        return { ok: false, error: { kind: 'email-already-exists' } };
      }

      // 登録された唯一の行を API 表現へ変換して返す。
      return { ok: true, value: this.mapRow(row) };
    } catch (error) {
      // 一意制約以外の SQL 失敗は原因を記録可能な内部失敗として閉じ込める。
      return { ok: false, error: { kind: 'persistence-failure', cause: error } };
    }
  }

  /**
   * Drizzle の保存行を OpenAPI 生成型へ変換する。
   *
   * @param row D1/Drizzle が返したユーザー行。
   * @returns HTTP 応答と同じ文字列表現のユーザー。
   */
  private mapRow(row: UserRow): User {
    // D1 の実行環境差を吸収し、日時を API 契約の ISO 8601 文字列へ統一する。
    const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: createdAt.toISOString(),
    };
  }
}
