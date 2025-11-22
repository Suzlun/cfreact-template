import type { Bindings } from '@server/types';

import type { UsersUseCases } from './dependencies/users';

export interface AppVariables {
  usersUseCases: UsersUseCases;
  kv: Bindings['KV'];
  r2: Bindings['R2'];
}
