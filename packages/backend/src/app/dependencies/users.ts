import { ulid } from 'ulid';

import {
  CloudflareUserCreatedNotifier,
  createDrizzleClient,
  DrizzleUserRepository,
} from '@cfreact-template/backend/persistence';
import type { Bindings } from '@cfreact-template/backend/types';
import {
  CreateUser,
  GetUser,
  ListUsers,
  type UsersUseCases,
} from '@cfreact-template/backend/usecases';

/** 永続化・通知・ID発行の依存を注入してユーザーUseCase群を組み立てる。 */
export const createUsersUseCases = (bindings: Bindings): UsersUseCases => {
  // D1 bindingをDrizzle clientへ変換し、RepositoryがSQLを直接扱わずに済むようにする。
  const drizzle = createDrizzleClient(bindings.DB);
  const repository = new DrizzleUserRepository(drizzle);
  // Cloudflare Email Bindingを通知ポートへ接続し、usecaseからインフラ詳細を隠す。
  const userCreatedNotifier = new CloudflareUserCreatedNotifier(bindings.EMAIL, {
    from: bindings.EMAIL_FROM,
    to: bindings.EMAIL_TO,
  });

  return {
    listUsers: new ListUsers(repository),
    createUser: new CreateUser(repository, userCreatedNotifier, ulid),
    getUser: new GetUser(repository),
  };
};
