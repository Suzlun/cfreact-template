import { createDrizzleClient } from '@server/adapters/persistence/drizzle/db.js';
import { DrizzleUserRepository } from '@server/adapters/persistence/drizzle/user-repository.js';
import { CreateUser } from '@server/core/usecases/users/create-user.js';
import { GetUser } from '@server/core/usecases/users/get-user.js';
import { ListUsers } from '@server/core/usecases/users/list-users.js';
import type { Bindings } from '@server/types.js';

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
