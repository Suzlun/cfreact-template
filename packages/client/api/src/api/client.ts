import { createApiSdk, type HelloResponse, type User } from '../sdk';

import type { CreateUserPayload, Hello } from '../types';

const sdk = createApiSdk();

const toHello = (dto: HelloResponse): Hello => ({
  message: dto.message,
  timestamp: new Date(dto.timestamp),
});

const toUser = (dto: User) => ({
  id: dto.id,
  name: dto.name,
  email: dto.email,
  createdAt: new Date(dto.createdAt),
});

/** Hello API wrapper for the greeting endpoint. */
const helloApi = {
  get: async (): Promise<Hello> => {
    const { data } = await sdk.hello.get();
    return toHello(data);
  },
};

/** Users API wrapper for list/create/get operations. */
const usersApi = {
  list: async () => {
    const { data } = await sdk.users.list();
    return data.map((user) => toUser(user));
  },
  create: async (payload: CreateUserPayload) => {
    const response = await sdk.users.create(payload);
    if (response.status !== 201) {
      const maybeError = response.data as { error?: string };
      throw new Error(maybeError.error ?? 'Failed to create user');
    }
    return toUser(response.data);
  },
  get: async (id: number) => {
    const response = await sdk.users.get(id);
    if (response.status !== 200) {
      return null;
    }
    return toUser(response.data);
  },
};

export { helloApi, usersApi };

// SDK types are internal; consumers should use domain types
