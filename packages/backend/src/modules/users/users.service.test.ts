import { describe, expect, it } from 'vitest';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

type CreateUser = UsersRepository['create'];
type UsersServiceOptions = ConstructorParameters<typeof UsersService>[1];

const createService = (create: CreateUser, options: UsersServiceOptions): UsersService => {
  // 実行環境へ接続しないリポジトリを構築し、対象の作成結果だけを決定的な関数へ差し替える。
  const repository = new UsersRepository({} as ConstructorParameters<typeof UsersRepository>[0]);
  repository.create = create;
  return new UsersService(repository, options);
};

describe('UsersService', () => {
  it('メール重複を内部詳細のない業務失敗へ変換する', async () => {
    const service = createService(
      async () => ({ ok: false, error: { kind: 'email-already-exists' } }),
      {
        sendEmail: async () => undefined,
        logFailure: () => undefined,
      }
    );

    const result = await service.create({ name: 'Duplicate User', email: 'duplicate@example.com' });

    expect(result).toEqual({ ok: false, error: { kind: 'email-already-exists' } });
  });

  it('永続化失敗を記録して安全な業務失敗へ変換する', async () => {
    const persistenceFailure = new Error('database details');
    const failures: { event: string; cause: unknown }[] = [];
    const service = createService(
      async () => ({
        ok: false,
        error: { kind: 'persistence-failure', cause: persistenceFailure },
      }),
      {
        sendEmail: async () => undefined,
        logFailure: (event, cause) => {
          failures.push({ event, cause });
        },
      }
    );

    const result = await service.create({ name: 'Failed User', email: 'failed@example.com' });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'persistence-failure', cause: persistenceFailure },
    });
    expect(failures).toEqual([
      { event: 'users.create.persistence-failure', cause: persistenceFailure },
    ]);
  });

  it('通知失敗を記録しながら作成成功を維持する', async () => {
    const notificationFailure = new Error('email unavailable');
    const failures: { event: string; cause: unknown }[] = [];
    const createdUser = {
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      name: 'Created User',
      email: 'created@example.com',
      createdAt: '2026-08-22T00:00:00.000Z',
    };
    const service = createService(async () => ({ ok: true, value: createdUser }), {
      emailFrom: 'sender@example.com',
      emailTo: 'receiver@example.com',
      sendEmail: async () => {
        throw notificationFailure;
      },
      logFailure: (event, cause) => {
        failures.push({ event, cause });
      },
    });

    const result = await service.create({ name: createdUser.name, email: createdUser.email });

    expect(result).toEqual({ ok: true, value: createdUser });
    expect(failures).toEqual([
      { event: 'users.create.notification-failure', cause: notificationFailure },
    ]);
  });
});
