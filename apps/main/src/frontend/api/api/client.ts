import {
  createApiSdk,
  type createUserResponse,
  type getHelloResponse,
  type getUserResponse,
  type HelloResponse,
  type listUsersResponse,
  type User as UserDto,
} from '@cfreact-template/main/frontend/api/sdk';
import type { CreateUserPayload, Hello, User } from '@cfreact-template/main/frontend/api/types';

type ApiErrorResponse = Extract<
  createUserResponse | getHelloResponse | getUserResponse | listUsersResponse,
  { status: 400 | 404 | 409 | 500 }
>;

/**
 * API が公開する安全な失敗情報を、フロントエンド内部で失わずに伝播するエラー。
 *
 * @remarks
 * `message`にはAPIが公開を許可した文言だけを保持し、ドメイン層が利用者向けの回復案内を
 * 選択できるよう、HTTP状態番号とエラーコードも保持する。生成SDKの応答本文そのものは
 * API境界の外へ公開しない。
 *
 * @example
 * ```ts
 * try {
 *   await usersApi.create(payload);
 * } catch (error) {
 *   if (error instanceof FrontendApiError && error.code === 'USER_EMAIL_ALREADY_EXISTS') {
 *     // メールアドレスの重複に適した回復案内へ変換する。
 *   }
 * }
 * ```
 */
class FrontendApiError extends Error {
  /** APIが返したHTTP状態番号。 */
  readonly status: ApiErrorResponse['status'];

  /** APIが返した安全なエラーコード。 */
  readonly code: ApiErrorResponse['data']['code'];

  /**
   * API の失敗応答から内部エラーを生成する。
   *
   * @param response - 生成 SDK が返した、状態番号と本文の対応が保証された失敗応答。
   */
  constructor(response: ApiErrorResponse) {
    // 既存画面のメッセージ表示を変えないため、安全な API メッセージを Error の本文へ渡す。
    super(response.data.message);
    this.name = 'FrontendApiError';
    // 生成応答全体を保持せず、ドメイン層の安全な分岐に必要な公開値だけを投影する。
    this.status = response.status;
    this.code = response.data.code;
  }
}

const sdk = createApiSdk();

/**
 * 生成 SDK の挨拶データをフロントエンドの日時表現へ変換する。
 *
 * @param dto - API 契約に従う挨拶データ。
 * @returns タイムスタンプを `Date` に変換した挨拶データ。
 */
const toHello = (dto: HelloResponse): Hello => ({
  message: dto.message,
  timestamp: new Date(dto.timestamp),
});

/**
 * 生成 SDK のユーザーデータをフロントエンドの日時表現へ変換する。
 *
 * @param dto - API 契約に従うユーザーデータ。
 * @returns 作成日時を `Date` に変換したユーザーデータ。
 */
const toUser = (dto: UserDto): User => ({
  id: dto.id,
  name: dto.name,
  email: dto.email,
  createdAt: new Date(dto.createdAt),
});

/**
 * 到達不能な応答をコンパイル時に検出し、実行時にも不正な応答を明示する。
 *
 * @param response - すべての既知状態を処理した後に残ってはならない値。
 * @returns 戻ることはなく、必ず例外を送出する。
 * @throws `TypeError` 生成 SDK の契約外の応答へ実行時に到達した場合。
 */
const assertNeverResponse = (_response: never): never => {
  // 生成 SDK の共用体に状態が追加された際は引数が never でなくなり、型検査で処理漏れを検出する。
  throw new TypeError('Unexpected API response');
};

/**
 * 挨拶 API の生成 SDK を、フロントエンド用データと内部エラーへ変換する境界。
 */
const helloApi = {
  get: async (): Promise<Hello> => {
    // 生成 SDK の状態番号と本文の判別可能な共用体を、そのまま受け取る。
    const response = await sdk.hello.get();

    // 成功と契約済み失敗を列挙し、将来の状態追加を型検査で検出する。
    switch (response.status) {
      case 200:
        return toHello(response.data);
      case 500:
        throw new FrontendApiError(response);
      default:
        return assertNeverResponse(response);
    }
  },
};

/**
 * ユーザー API の生成 SDK を、フロントエンド用データと内部エラーへ変換する境界。
 */
const usersApi = {
  list: async (): Promise<User[]> => {
    // 一覧取得の生成応答を状態番号で絞り込み、本文との対応を維持する。
    const response = await sdk.users.list();

    switch (response.status) {
      case 200:
        return response.data.map((user) => toUser(user));
      case 500:
        throw new FrontendApiError(response);
      default:
        return assertNeverResponse(response);
    }
  },
  create: async (payload: CreateUserPayload): Promise<User> => {
    // 入力を生成 SDK へ渡し、作成結果を状態番号で完全に判別する。
    const response = await sdk.users.create(payload);

    switch (response.status) {
      case 201:
        return toUser(response.data);
      case 400:
      case 409:
      case 500:
        throw new FrontendApiError(response);
      default:
        return assertNeverResponse(response);
    }
  },
  get: async (id: string): Promise<User | null> => {
    // 指定 ID の生成応答を取得し、未存在だけを null へ変換する。
    const response = await sdk.users.get(id);

    switch (response.status) {
      case 200:
        return toUser(response.data);
      case 404:
        return null;
      case 400:
      case 500:
        throw new FrontendApiError(response);
      default:
        return assertNeverResponse(response);
    }
  },
};

export { FrontendApiError, helloApi, usersApi };
