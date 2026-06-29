import type { User } from '@cfreact-template/backend/domain/users/user';

/** Port to notify when a user is created. */
export interface UserCreatedNotifier {
  notifyUserCreated(user: User): Promise<void>;
}
