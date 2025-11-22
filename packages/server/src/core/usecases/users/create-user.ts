import type { CreateUserInput, User } from '@server/core/domain/users/user';
import type { UserRepository } from '@server/core/domain/users/user-repository';

export class CreateUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    if (input.name.trim() === '' || input.email.trim() === '') {
      throw new Error('Name and email are required');
    }

    return this.userRepository.create(input);
  }
}
