import type { Bindings } from '@server/types.js';

import type { UsersUseCases } from './dependencies/users.js';

export interface AppVariables {
  usersUseCases: UsersUseCases;
  kv: Bindings['KV'];
  r2: Bindings['R2'];
}
