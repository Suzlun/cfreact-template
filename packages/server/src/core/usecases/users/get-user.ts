import type { User } from '@server/core/domain/users/user';
import type { UserRepository } from '@server/core/domain/users/user-repository';

export class GetUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
