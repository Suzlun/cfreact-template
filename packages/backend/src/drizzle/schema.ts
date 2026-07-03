import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** usersテーブルのDrizzleスキーマ定義。 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** usersテーブルから推論される取得行型。 */
export type User = typeof users.$inferSelect;
/** usersテーブルから推論される登録行型。 */
export type NewUser = typeof users.$inferInsert;
