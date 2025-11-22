import type { User } from '@server/core/domain/users/user';
import type { UserRepository } from '@server/core/domain/users/user-repository';

export class ListUsers {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
