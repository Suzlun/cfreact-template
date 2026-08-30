import { describe, expect, it } from 'vitest';

import { createCoreSdk } from './client';

describe('createCoreSdk', () => {
  it('接続先を実行時に解決し、認証情報とリダイレクト拒否を強制する', async () => {
    const token = 'backend-token_0123456789abcdefghijklmnopqrstuvwxyz';
    let receivedRequest: Request | undefined;
    const fetch: typeof globalThis.fetch = (input, init) => {
      receivedRequest = new Request(input, init);
      return Promise.resolve(
        new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })
      );
    };
    const sdk = createCoreSdk({
      baseUrl: 'https://core.example.test/gateway',
      token,
      fetch,
    });

    await sdk.listUsers({
      headers: { Authorization: 'Bearer caller-controlled-token' },
      redirect: 'follow',
    });

    expect(receivedRequest?.url).toBe('https://core.example.test/gateway/internal/v1/users');
    expect(receivedRequest?.headers.get('authorization')).toBe(`Bearer ${token}`);
    expect(receivedRequest?.redirect).toBe('manual');
  });

  it('ループバック以外の平文HTTP接続先を拒否する', () => {
    expect(() =>
      createCoreSdk({
        baseUrl: 'http://core.example.test',
        token: 'backend-token_0123456789abcdefghijklmnopqrstuvwxyz',
        fetch: globalThis.fetch,
      })
    ).toThrow('core API base URL must use HTTPS');
  });

  it('短いBearerトークンを拒否する', () => {
    expect(() =>
      createCoreSdk({
        baseUrl: 'https://core.example.test',
        token: 'short-token',
        fetch: globalThis.fetch,
      })
    ).toThrow('core API token must be a high-entropy Bearer token');
  });

  it('core APIのリダイレクト応答を拒否する', async () => {
    const sdk = createCoreSdk({
      baseUrl: 'https://core.example.test',
      token: 'backend-token_0123456789abcdefghijklmnopqrstuvwxyz',
      fetch: () =>
        Promise.resolve(
          new Response(null, {
            status: 302,
            headers: { location: 'https://unexpected.example.test' },
          })
        ),
    });

    await expect(sdk.listUsers()).rejects.toThrow('core API redirects are not allowed');
  });
});
