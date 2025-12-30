import type { User, UserRepository } from '@cfreact-template-server/domain';

/** Use case to fetch a user by id. */
export class GetUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
