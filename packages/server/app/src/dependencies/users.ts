import { createDrizzleClient, DrizzleUserRepository } from '@cfreact-template-server/persistence';
import type { Bindings } from '@cfreact-template-server/types';
import { CreateUser, GetUser, ListUsers } from '@cfreact-template-server/usecases';

/** Use case instances for user-related operations. */
export interface UsersUseCases {
  listUsers: ListUsers;
  createUser: CreateUser;
  getUser: GetUser;
}

/** Build user use cases with persistence dependencies. */
export const createUsersUseCases = (bindings: Bindings): UsersUseCases => {
  const drizzle = createDrizzleClient(bindings.DB);
  const repository = new DrizzleUserRepository(drizzle);

  return {
    listUsers: new ListUsers(repository),
    createUser: new CreateUser(repository),
    getUser: new GetUser(repository),
  };
};
