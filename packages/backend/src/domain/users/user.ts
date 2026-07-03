/**
 * ユーザーIDとして扱うULID文字列型。
 *
 * @remarks
 * 26文字のCrockford Base32 ULIDだけをユーザーIDとして扱います。
 * API、DB、フロントエンドの全境界で同じ文字列表現を維持します。
 *
 * @example
 * ```ts
 * const id: UserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
 * ```
 */
export type UserId = string;

/**
 * ULID形式をOpenAPIへ渡すための正規表現文字列。
 *
 * @remarks
 * TypeSpec、Zod OpenAPI、実行時検証の意図を揃えるために公開します。
 */
export const USER_ID_ULID_PATTERN_SOURCE = '^[0-9A-HJKMNP-TV-Z]{26}$' as const;

/**
 * ユーザーIDがULID形式か検証する正規表現。
 *
 * @remarks
 * HTTP入力とID発行関数の結果をDBへ渡す前に検証するために使います。
 */
export const USER_ID_ULID_PATTERN = /^[\dA-HJKMNP-TV-Z]{26}$/;

/** Domain層が公開するユーザーエンティティの形。 */
export interface User {
  id: UserId;
  name: string;
  email: string;
  createdAt: Date;
}

/** ユーザー作成APIが受け取る入力。 */
export interface CreateUserInput {
  name: string;
  email: string;
}

/** 永続化ポートがユーザー作成時に受け取る正規化済み入力。 */
export interface ValidCreateUserInput {
  id: UserId;
  name: string;
  email: string;
}

/** ユーザー作成入力が不正な場合の安定したエラーコード。 */
export const INVALID_CREATE_USER_INPUT_ERROR_CODE = 'INVALID_CREATE_USER_INPUT' as const;

/** ユーザーIDがULID契約に違反した場合の安定したエラーコード。 */
export const INVALID_USER_ID_ERROR_CODE = 'INVALID_USER_ID' as const;

/** ユーザー作成入力で検証するフィールド名。 */
export type InvalidCreateUserInputField = 'name' | 'email';

/** ユーザー作成入力が不正な場合に投げるDomainエラー。 */
export class InvalidCreateUserInputError extends Error {
  readonly code = INVALID_CREATE_USER_INPUT_ERROR_CODE;

  constructor(readonly field: InvalidCreateUserInputField) {
    super('Name and email are required');
    this.name = 'InvalidCreateUserInputError';
  }
}

/** ユーザーIDがULID契約に違反した場合に投げるDomainエラー。 */
export class InvalidUserIdError extends Error {
  readonly code = INVALID_USER_ID_ERROR_CODE;

  constructor() {
    super('User id must be a ULID');
    this.name = 'InvalidUserIdError';
  }
}

/** ユーザー作成入力をDomain不変条件に合わせて正規化・検証する。 */
export const normalizeCreateUserInput = (
  input: CreateUserInput
): Pick<ValidCreateUserInput, 'name' | 'email'> => {
  // 入力値の前後空白を取り除き、保存される値の表現を一定にする。
  const name = input.name.trim();
  const email = input.email.trim();

  // 名前が空だと顧客が識別できるユーザーにならないため拒否する。
  if (name === '') {
    throw new InvalidCreateUserInputError('name');
  }

  // メールアドレスが空だと通知先と識別情報が欠けるため拒否する。
  if (email === '') {
    throw new InvalidCreateUserInputError('email');
  }

  // IDはusecaseで発行するため、ここではユーザー入力由来の値だけ返す。
  return { name, email };
};
