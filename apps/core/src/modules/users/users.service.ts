import { ulid } from 'ulid';

import {
  type UsersRepositoryEmailConflict,
  type UsersRepositoryPersistenceFailure,
  type UsersRepository,
} from './users.repository';

import type { CreateUserInput, User, UserId } from './users.types';
import type { EmailPayload, FailureLogger, Result } from '@cfreact-template/core/types';

interface InvalidInputFailure {
  kind: 'invalid-input';
}

interface UserNotFoundFailure {
  kind: 'not-found';
}

interface EmailAlreadyExistsFailure {
  kind: 'email-already-exists';
}

interface PersistenceFailure {
  kind: 'persistence-failure';
  cause: unknown;
}

/** ユーザー作成で予期される失敗の閉じた共用体。 */
type CreateUserFailure = InvalidInputFailure | EmailAlreadyExistsFailure | PersistenceFailure;

/** ユーザー一覧取得で予期される失敗の閉じた共用体。 */
type ListUsersFailure = PersistenceFailure;

/** ユーザー単一取得で予期される失敗の閉じた共用体。 */
type GetUserFailure = UserNotFoundFailure | PersistenceFailure;

/**
 * ユーザー作成通知を送るための設定。
 *
 * @remarks
 * 本文と件名はこのリソースが所有し、送信そのものは構成起点から注入された関数へ委譲します。
 */
interface UsersServiceOptions {
  /** 通知を送信する外部メール関数。 */
  sendEmail: (message: EmailPayload) => Promise<void>;
  /** 通知や永続化の内部失敗を記録する関数。 */
  logFailure: FailureLogger;
  /** 通知メールの送信元。未設定の場合は通知を送らない。 */
  emailFrom?: string;
  /** 通知メールの宛先。未設定の場合は通知を送らない。 */
  emailTo?: string;
}

/**
 * 利用者資源の公開業務 API。
 *
 * @remarks
 * HTTP、`Hono`、`D1` バインディングを知らず、`TypeSpec` から生成された検証処理を通った入力の業務上の正規化、
 * `UsersRepository` の調整、通知失敗の非致命化だけを担当する。各公開メソッドは予期される失敗を
 * `Result` で返し、内部原因を例外として利用者側へ漏らさない。
 *
 * @example
 * ```ts
 * const service = new UsersService(repository, { sendEmail, logFailure });
 * const result = await service.list();
 * ```
 */
export class UsersService {
  /**
   * リポジトリと外部通知・観測処理を受け取ってサービスを構築する。
   *
   * @remarks
   * 構築時には外部通信を行わず、通常は例外を送出しない。
   *
   * @param repository 利用者データへアクセスする `UsersRepository`。
   * @param options メール送信、失敗記録、通知先に関する構成起点の設定。
   */
  constructor(
    private readonly repository: UsersRepository,
    private readonly options: UsersServiceOptions
  ) {}

  /**
   * ユーザーを正規化して作成し、作成後に通知を試みる。
   *
   * @remarks
   * D1 への登録を行い、通知設定が揃っていればメールを送信する。通知失敗は記録して成功結果を維持する。
   * 予期される入力不正、メール重複、永続化失敗では例外を送出せず、失敗を `Result` で返す。
   *
   * @param input TypeSpec/OpenAPI から生成された検証処理が構文を確認済みのユーザー作成入力。
   * @returns 作成済みユーザー、入力不正、メール重複、または安全な内部失敗。
   *
   * @example
   * ```ts
   * const result = await service.create({ name: 'Ada', email: 'ada@example.com' });
   * ```
   */
  async create(input: CreateUserInput): Promise<Result<User, CreateUserFailure>> {
    // 名前だけは前後空白を除いて保存し、メールアドレスは表記の曖昧さを防ぐため空白付き入力を拒否する。
    const normalized = normalizeCreateUserInput(input);
    if (!normalized.ok) {
      return normalized;
    }

    // ID はサービス境界で発行し、契約で定めた ULID を永続化へ渡す。
    const persisted = await this.repository.create({ id: ulid(), ...normalized.value });
    if (!persisted.ok) {
      return this.mapRepositoryCreateFailure(persisted.error);
    }

    // 通知はデータ作成後の非致命的副作用として扱い、送信失敗で成功結果を取り消さない。
    await this.notifyUserCreated(persisted.value);
    return persisted;
  }

  /**
   * すべてのユーザーを取得する。
   *
   * @remarks
   * D1 を読み取り、失敗時は内部原因を記録する。予期される永続化失敗では例外を送出しない。
   *
   * @returns ユーザー配列、またはログ済みの内部永続化失敗。
   *
   * @example
   * ```ts
   * const result = await service.list();
   * ```
   */
  async list(): Promise<Result<User[], ListUsersFailure>> {
    // リポジトリの結果をそのまま返し、失敗原因だけは利用者へ公開せず記録する。
    const result = await this.repository.findAll();
    if (!result.ok) {
      this.options.logFailure('users.list.persistence-failure', result.error.cause);
      return { ok: false, error: { kind: 'persistence-failure', cause: result.error.cause } };
    }

    return { ok: true, value: result.value };
  }

  /**
   * ID で一人のユーザーを取得する。
   *
   * @remarks
   * D1 を読み取り、永続化失敗時は内部原因を記録する。未存在と予期される永続化失敗では例外を送出しない。
   *
   * @param id TypeSpec/OpenAPI が検証したユーザー ID。
   * @returns ユーザー、未存在、またはログ済みの内部永続化失敗。
   *
   * @example
   * ```ts
   * const result = await service.get('01ARZ3NDEKTSV4RRFFQ69G5FAV');
   * ```
   */
  async get(id: UserId): Promise<Result<User, GetUserFailure>> {
    // リポジトリの `null` を利用者向けの未存在失敗へ変換し、データベース行を上位へ漏らさない。
    const result = await this.repository.findById(id);
    if (!result.ok) {
      this.options.logFailure('users.get.persistence-failure', result.error.cause);
      return { ok: false, error: { kind: 'persistence-failure', cause: result.error.cause } };
    }

    if (result.value == null) {
      return { ok: false, error: { kind: 'not-found' } };
    }

    return { ok: true, value: result.value };
  }

  /**
   * リポジトリの作成結果をサービスの閉じた失敗型へ写像する。
   *
   * @param failure リポジトリが閉じ込めた永続化失敗。
   * @returns HTTP 層へ渡す前のサービス失敗。
   */
  private mapRepositoryCreateFailure(
    failure: UsersRepositoryEmailConflict | UsersRepositoryPersistenceFailure
  ): Result<never, CreateUserFailure> {
    if (failure.kind === 'email-already-exists') {
      return { ok: false, error: { kind: 'email-already-exists' } };
    }

    this.options.logFailure('users.create.persistence-failure', failure.cause);
    return { ok: false, error: { kind: 'persistence-failure', cause: failure.cause } };
  }

  /**
   * 作成済みユーザーの通知を試みる。
   *
   * @param user 通知本文へ埋め込む作成済みユーザー。
   * @returns 通知の成否に関係なく解決する Promise。
   */
  private async notifyUserCreated(user: User): Promise<void> {
    // 未設定または空白だけの通知先では送信せず、設定値自体は安全性検査を担うメール基盤へ加工せず渡す。
    const from = this.options.emailFrom ?? '';
    const to = this.options.emailTo ?? '';
    if (from.trim() === '' || to.trim() === '') {
      return;
    }

    try {
      // 利用者資源固有の件名・本文はここで組み立て、基盤層は一般メールとして送信するだけにする。
      await this.options.sendEmail({
        from,
        to,
        subject: 'New user created in cfreact-template',
        text: [
          'A new user was created.',
          `id: ${user.id}`,
          `name: ${user.name}`,
          `email: ${user.email}`,
          `createdAt: ${user.createdAt}`,
        ].join('\n'),
      });
    } catch (error) {
      // 通知失敗は保存済みデータと API 成功結果を一致させるため、記録だけして成功を維持する。
      this.options.logFailure('users.create.notification-failure', error);
    }
  }
}

/**
 * 構文検証済みのユーザー作成入力へ、保存前の業務規則を適用する。
 *
 * @param input `TypeSpec` から生成された検証処理を通ったユーザー作成入力。
 * @returns 正規化済み入力、または入力不正の失敗。
 */
const normalizeCreateUserInput = (
  input: CreateUserInput
): Result<Pick<CreateUserInput, 'name' | 'email'>, InvalidInputFailure> => {
  const name = input.name.trim();
  const email = input.email;

  // 名前は前後空白を保存せず、空白だけの名前を拒否する。
  if (name === '') {
    return { ok: false, error: { kind: 'invalid-input' } };
  }

  // メールアドレスの構文は生成された検証処理に委ね、業務上許可しない前後空白だけを拒否する。
  if (email !== email.trim()) {
    return { ok: false, error: { kind: 'invalid-input' } };
  }

  return { ok: true, value: { name, email } };
};
