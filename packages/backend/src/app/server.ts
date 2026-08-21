import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import healthApi from '@cfreact-template/backend/generated/api/health/health';
import helloApi from '@cfreact-template/backend/generated/api/hello/hello';
import type { components } from '@cfreact-template/backend/generated/api/openapi';
import usersApi from '@cfreact-template/backend/generated/api/users/users';
import { inspectSafeErrorResponse } from '@cfreact-template/backend/platform/http/responseValidation';
import { logFailure } from '@cfreact-template/backend/platform/observability/logger';
import type { Bindings } from '@cfreact-template/backend/types';

import { createServices } from './services';

type AppVariables = ReturnType<typeof createServices>;

// 生成された契約へ固定応答を接続し、TypeSpec の変更時に最終 HTTP 境界の不一致を型検査で検出する。
const invalidRequestResponse = {
  code: 'INVALID_REQUEST',
  message: 'Invalid request',
} satisfies components['schemas']['InvalidRequestError'];

// 未知のパスも不正要求と同じ安全な本文構造を使い、内部の経路情報を公開しない。
const notFoundResponse = {
  code: 'INVALID_REQUEST',
  message: 'Not found',
} satisfies components['schemas']['InvalidRequestError'];

// 未知の例外は原因に依存しない固定応答へ変換し、生成契約からの逸脱を防ぐ。
const internalErrorResponse = {
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
} satisfies components['schemas']['InternalError'];

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

// すべてのリクエストで運用ログを有効にし、未知の失敗を追跡できるようにする。
app.use('*', logger());

// CORS は既存の画面から API を利用するための境界として維持する。
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// 利用者 API の基底パスと配下だけでサービスを構築し、挨拶と稼働確認を利用者基盤から独立させる。
app.use('/api/v1/users/*', async (c, next) => {
  // `Hono` の単一ワイルドカードは基底パスにも一致するため、重複するミドルウェア登録なしで一度だけ構築する。
  const services = createServices(c.env);
  c.set('usersService', services.usersService);
  await next();
});

// `Orval` の標準検証処理が返す不正入力応答を、`TypeSpec` の安全なエラー契約へ統一する。
app.use('*', async (c, next) => {
  await next();
  if (c.res.status === 400) {
    // ハンドラーが返した安全な契約済み 400 は保持し、生成入力検証の詳細だけを固定応答へ置き換える。
    const inspection = await inspectSafeErrorResponse(c.res);
    if (!inspection.safe) {
      c.res = c.json(invalidRequestResponse, 400);
    }
  }
});

// `TypeSpec` から生成したリソース別 `Hono` アプリだけを合成し、パス、HTTP メソッド、スキーマを手書きしない。
app.route('/', usersApi);
app.route('/', helloApi);
app.route('/', healthApi);

// 未知のパスでも内部情報を返さず、安全な 404 応答本文だけを返す。
app.notFound((c) => {
  return c.json(notFoundResponse, 404);
});

// JSON 構文エラーなど Hono が識別した不正入力は詳細を公開せず、契約済みの固定 400 応答へ変換する。
app.onError((err, c) => {
  if (err instanceof HTTPException && err.status === 400) {
    return c.json(invalidRequestResponse, 400);
  }

  // 予期しない例外は詳細をログへ残し、利用者へは固定された 500 応答本文だけを返す。
  logFailure('http.unhandled-error', err);
  return c.json(internalErrorResponse, 500);
});

/**
 * Cloudflare Workers へ公開する Hono アプリ。
 *
 * @remarks
 * `Hono` の `fetch` 契約に従ってリクエストを受け、生成された各リソースの経路へ応答を返す。
 * リクエストごとにログ出力と、利用者 API ではサービス構築を行う。予期しない例外は内部原因を記録し、
 * 利用者へは固定された 500 応答だけを返す。モジュールの読み込みだけでは外部通信を行わない。
 *
 * @example
 * ```ts
 * export { server as default } from '@cfreact-template/backend/app';
 * ```
 */
export default app;
