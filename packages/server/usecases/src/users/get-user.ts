import type { User, UserRepository } from '@cfreact-template-server/domain';

export class GetUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
