import { createApiSdk, type HelloResponse, type User } from '@cfreact-template/api-sdk';

import type { Hello } from '@client/types/hello';
import type { CreateUserPayload } from '@client/types/users';

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

export const helloApi = {
  get: async (): Promise<Hello> => {
    const { data } = await sdk.hello.get();
    return toHello(data);
  },
};

export const usersApi = {
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

export type { HelloResponse, User } from '@cfreact-template/api-sdk';
