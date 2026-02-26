import type { UsersUseCases } from '@cfreact-template-server/usecases';

/** Hono context variables injected by server app wiring. */
export interface AppVariables {
  usersUseCases: UsersUseCases;
}
