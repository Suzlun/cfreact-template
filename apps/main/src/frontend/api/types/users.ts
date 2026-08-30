/** クライアントで扱うユーザー情報。 */
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/** ユーザー作成APIへ送るpayload。 */
interface CreateUserPayload {
  name: string;
  email: string;
}

export type { CreateUserPayload, User };
