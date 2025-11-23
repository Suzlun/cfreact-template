import type { CreateUserInput, User } from './user';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
}
