import type { CreateUserInput, User, UserRepository } from '@cfreact-template-server/domain';

/** Use case to create a new user. */
export class CreateUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    if (input.name.trim() === '' || input.email.trim() === '') {
      throw new Error('Name and email are required');
    }

    return this.userRepository.create(input);
  }
}
