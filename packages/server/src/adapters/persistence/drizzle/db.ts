import { drizzle } from 'drizzle-orm/d1';

import type { Bindings } from '@server/types';

export type DrizzleClient = ReturnType<typeof drizzle>;

export const createDrizzleClient = (database: Bindings['DB']): DrizzleClient => {
  return drizzle(database);
};
