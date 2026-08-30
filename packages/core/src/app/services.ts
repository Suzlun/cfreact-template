import { UsersRepository } from '@cfreact-template/core/composition/modules/users/users.repository';
import { UsersService } from '@cfreact-template/core/modules/users';
import { createDatabaseClient } from '@cfreact-template/core/platform/database/client';
import { CloudflareEmailSender } from '@cfreact-template/core/platform/email/sendEmail';
import { logFailure } from '@cfreact-template/core/platform/observability/logger';

import type { Bindings } from '@cfreact-template/core/types';

/**
 * `Cloudflare` バインディングからアプリケーションサービスを明示的に構築する。
 *
 * @remarks
 * この関数自体は外部通信を行わず、通常は例外を送出しない。返したサービスの呼び出し時にだけ、
 * データベース操作、メール送信、失敗記録の副作用が発生する。
 *
 * @param bindings リクエストで利用可能な `Cloudflare` バインディング。
 * @returns HTTP 処理へ渡す業務サービス。`D1` とメールのバインディング自体は含めない。
 *
 * @example
 * ```ts
 * const services = createServices(context.env);
 * context.set('usersService', services.usersService);
 * ```
 */
export const createServices = (bindings: Bindings): { usersService: UsersService } => {
  // データベースバインディングは基盤の具体クライアントへ変換し、リポジトリへだけ渡す。
  const database = createDatabaseClient(bindings.DB);
  const repository = new UsersRepository(database);

  // メールバインディングは基盤へ閉じ込め、サービスには一般メール送信関数だけを渡す。
  const emailSender = new CloudflareEmailSender(bindings.EMAIL);
  const usersService = new UsersService(repository, {
    emailFrom: bindings.EMAIL_FROM,
    emailTo: bindings.EMAIL_TO,
    sendEmail: (message) => emailSender.send(message),
    logFailure,
  });

  return { usersService };
};
