import { createDrizzleClient } from '@server/adapters/persistence/drizzle/db';
import { DrizzleUserRepository } from '@server/adapters/persistence/drizzle/user-repository';
import { CreateUser } from '@server/core/usecases/users/create-user';
import { GetUser } from '@server/core/usecases/users/get-user';
import { ListUsers } from '@server/core/usecases/users/list-users';
import type { Bindings } from '@server/types';

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
