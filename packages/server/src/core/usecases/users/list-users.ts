import type { UserRepository } from '@server/core/domain/users/user-repository.js';
import type { User } from '@server/core/domain/users/user.js';

export class ListUsers {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
