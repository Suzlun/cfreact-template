import type {
  CreateUserInput,
  User,
  UserCreatedNotifier,
  UserRepository,
} from '@cfreact-template-server/domain';

/** Use case to create a new user. */
export class CreateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userCreatedNotifier: UserCreatedNotifier
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    if (input.name.trim() === '' || input.email.trim() === '') {
      throw new Error('Name and email are required');
    }

    const createdUser = await this.userRepository.create(input);

    try {
      await this.userCreatedNotifier.notifyUserCreated(createdUser);
    } catch {
      // Notification failures must not block user creation.
    }

    return createdUser;
  }
}
