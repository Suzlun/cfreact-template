import type { CreateUser } from '@cfreact-template/backend/usecases/users/create-user';
import type { GetUser } from '@cfreact-template/backend/usecases/users/get-user';
import type { ListUsers } from '@cfreact-template/backend/usecases/users/list-users';

/** Use case instances for user-related operations. */
export interface UsersUseCases {
  listUsers: ListUsers;
  createUser: CreateUser;
  getUser: GetUser;
}
