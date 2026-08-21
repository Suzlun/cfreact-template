import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * ユーザーリソースが所有する `users` テーブル定義。
 *
 * @remarks
 * テーブル名、列名、型、既定値、メールアドレス一意制約を宣言する。定義の生成時に外部通信や SQL 実行はなく、
 * 静的な列定義では例外を送出しない。
 *
 * @example
 * ```ts
 * const rows = await db.select().from(users).all();
 * ```
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * `users` テーブルから推論される取得行型。
 *
 * @remarks
 * `UsersRepository` の行入力を型付けする。型定義なので実行時の戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * const row: UserRow = await db.select().from(users).get();
 * ```
 */
export type UserRow = typeof users.$inferSelect;
