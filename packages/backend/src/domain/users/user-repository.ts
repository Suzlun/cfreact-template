import type { User, ValidCreateUserInput } from '@cfreact-template/backend/domain/users/user';

/** Persistence port for user data access. */
export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  create(input: ValidCreateUserInput): Promise<User>;
}
