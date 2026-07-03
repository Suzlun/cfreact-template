import type { User, UserId, UserRepository } from '@cfreact-template/backend/domain';

/** ULIDで指定されたユーザーを取得するユースケース。 */
export class GetUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: UserId): Promise<User | null> {
    // ID形式の検証はHTTP境界で済ませ、usecaseではRepositoryへの問い合わせに集中する。
    return this.userRepository.findById(id);
  }
}
