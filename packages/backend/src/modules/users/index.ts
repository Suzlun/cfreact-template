/**
 * 利用者リソースを他の構成要素から利用するための公開サービス。
 *
 * @remarks
 * 再公開自体には引数、戻り値、例外、副作用はない。各メソッドの契約は `UsersService` を参照する。
 *
 * @example
 * ```ts
 * import { UsersService } from '@cfreact-template/backend/modules/users';
 * ```
 */
export { UsersService } from './users.service';

/**
 * 公開サービスの入力と結果に使う、API 契約由来の安定した型。
 *
 * @remarks
 * 型の再公開なので実行時の引数、戻り値、例外、副作用はない。
 *
 * @example
 * ```ts
 * import type { CreateUserInput, User, UserId } from '@cfreact-template/backend/modules/users';
 * ```
 */
export type { CreateUserInput, User, UserId } from './users.types';
