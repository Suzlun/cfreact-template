import { eq } from 'drizzle-orm';

import { users } from '@cfreact-template/backend/drizzle';

import type {
  User,
  UserId,
  UserRepository,
  ValidCreateUserInput,
} from '@cfreact-template/backend/domain';
import type { DrizzleClient } from '@cfreact-template/backend/persistence/drizzle/db';

/** Drizzleを使ってユーザー永続化ポートを実装するRepository。 */
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findAll(): Promise<User[]> {
    // usersテーブルの全行を取得し、永続化表現からDomain表現へ変換する。
    const rows = await this.db.select().from(users).all();
    return rows.map((row) => this.mapRow(row));
  }

  async findById(id: UserId): Promise<User | null> {
    // ULID主キーで1行だけ取得し、存在しない場合はnullとして返す。
    const row = await this.db.select().from(users).where(eq(users.id, id)).get();

    if (row == null) {
      return null;
    }

    return this.mapRow(row);
  }

  async create(input: ValidCreateUserInput): Promise<User> {
    // usecaseで生成済みのULIDを含む入力を、そのままusersテーブルへ登録する。
    const [row] = await this.db.insert(users).values(input).returning();
    if (row == null) {
      throw new Error('Failed to create user');
    }
    return this.mapRow(row);
  }

  private mapRow(row: (typeof users)['$inferSelect']): User {
    // D1/Drizzleの日時表現差を吸収し、DomainではDateとして扱えるように統一する。
    const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt,
    };
  }
}
