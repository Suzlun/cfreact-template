/** User entity shape exposed by the domain. */
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

/** Input required to create a user. */
export interface CreateUserInput {
  name: string;
  email: string;
}
