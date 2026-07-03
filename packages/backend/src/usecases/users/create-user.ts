import {
  InvalidUserIdError,
  normalizeCreateUserInput,
  USER_ID_ULID_PATTERN,
} from '@cfreact-template/backend/domain';
import type {
  CreateUserInput,
  User,
  UserCreatedNotifier,
  UserRepository,
} from '@cfreact-template/backend/domain';

/** ユーザーを新規作成するユースケース。 */
export class CreateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userCreatedNotifier: UserCreatedNotifier,
    private readonly createUserId: () => User['id']
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    // API入力をDomainの不変条件に合わせて整え、保存前に不正値を排除する。
    const normalizedInput = normalizeCreateUserInput(input);

    // IDはDBの自動採番に任せず、アプリケーション境界でULIDとして発行する。
    const id = this.createUserId();

    // 注入されたID発行関数の結果も検証し、不正な主キーを永続化しない。
    if (!USER_ID_ULID_PATTERN.test(id)) {
      throw new InvalidUserIdError();
    }

    // 生成済みULIDを含めた正規化済み入力を永続化ポートへ渡す。
    const createdUser = await this.userRepository.create({ id, ...normalizedInput });

    try {
      // 通知は副作用なので、ユーザー作成の成否は永続化成功で確定させる。
      await this.userCreatedNotifier.notifyUserCreated(createdUser);
    } catch {
      // 通知失敗はユーザー作成を取り消す理由にしない。
    }

    return createdUser;
  }
}
