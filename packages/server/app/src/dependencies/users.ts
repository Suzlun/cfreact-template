import { createDrizzleClient, DrizzleUserRepository } from '@cfreact-template-server/persistence';
import type { Bindings } from '@cfreact-template-server/types';
import { CreateUser, GetUser, ListUsers } from '@cfreact-template-server/usecases';

export interface UsersUseCases {
  listUsers: ListUsers;
  createUser: CreateUser;
  getUser: GetUser;
}

export const createUsersUseCases = (bindings: Bindings): UsersUseCases => {
  const drizzle = createDrizzleClient(bindings.DB);
  const repository = new DrizzleUserRepository(drizzle);

  return {
    listUsers: new ListUsers(repository),
    createUser: new CreateUser(repository),
    getUser: new GetUser(repository),
  };
};
