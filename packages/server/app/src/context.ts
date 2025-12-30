import type { Bindings } from '@cfreact-template-server/types';

import type { UsersUseCases } from './dependencies/users';

/** Hono context variables injected by the server app wiring. */
export interface AppVariables {
  usersUseCases: UsersUseCases;
  kv: Bindings['KV'];
  r2: Bindings['R2'];
}
