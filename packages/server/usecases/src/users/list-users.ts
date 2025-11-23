import type { User, UserRepository } from '@cfreact-template-server/domain';

export class ListUsers {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
