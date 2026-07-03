import type {
  User,
  UserId,
  ValidCreateUserInput,
} from '@cfreact-template/backend/domain/users/user';

/** ユーザーデータへアクセスする永続化ポート。 */
export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: UserId): Promise<User | null>;
  create(input: ValidCreateUserInput): Promise<User>;
}
