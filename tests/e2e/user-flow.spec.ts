import { test, expect, type Page, type TestInfo } from '@playwright/test';

test('ホームで生成された挨拶リソースの応答を確認できる', async ({ page }) => {
  // 利用者が最初に開くホームへ移動し、生成された挨拶経路の成功結果が画面へ届くことを確認する。
  await page.goto('/');

  await expect(page.getByText('API Health', { exact: true })).toBeVisible();
  await expect(page.getByText('Hello from Hono + Cloudflare Workers')).toBeVisible();
  await expect(page.getByText('200 OK')).toBeVisible();
});

const waitForTableOrEmptyState = async (page: Page) => {
  const tableLocator = page.locator('table');
  const emptyMessageLocator = page.getByText(/no users found/i);

  await Promise.any([
    tableLocator.waitFor({ state: 'visible', timeout: 10000 }),
    emptyMessageLocator.waitFor({ state: 'visible', timeout: 10000 }),
  ]).catch((error: unknown) => {
    throw new Error('Unable to find users table or empty state within the expected time.', {
      cause: error,
    });
  });
};

const createTestUser = async (page: Page, testInfo: TestInfo) => {
  const identifier = `${testInfo.project.name}-${String(testInfo.parallelIndex)}-${String(Date.now())}`;
  const name = `Test User ${identifier}`;
  const email = `test-user-${identifier}@example.com`;

  await page.getByPlaceholder('Name').fill(name);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByRole('button', { name: /create user/i }).click();

  await expect(page.getByPlaceholder('Name')).toHaveValue('', { timeout: 5000 });
  await expect(page.getByPlaceholder('Email')).toHaveValue('');
  await expect(page.getByText(name)).toBeVisible({ timeout: 5000 });

  return { email, name };
};

test.describe('ユーザー管理フロー', () => {
  test.beforeEach(async ({ page }) => {
    // ユーザー管理の操作と一覧を提供する route へ移動する。
    await page.goto('/users');
  });

  test('ユーザー一覧で既存ユーザーを確認できる', async ({ page }, testInfo) => {
    const identifier = `${testInfo.project.name}-${String(testInfo.parallelIndex)}-${String(Date.now())}`;
    const name = `Listed User ${identifier}`;
    const email = `listed-user-${identifier}@example.com`;

    // 公開APIで一覧確認用の既存ユーザーを用意し、画面を再読込して取得結果を検証する。
    const response = await page.request.post('/api/v1/users', { data: { email, name } });
    expect(response.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('新しいユーザーを作成して一覧で確認できる', async ({ page }, testInfo) => {
    // データの初期状態を待つ
    await waitForTableOrEmptyState(page);

    // フォームに入力
    const user = await createTestUser(page, testInfo);

    // 作成したユーザーがリストに表示されることを確認
    await expect(page.getByText(user.email)).toBeVisible();
  });

  test('重複メールでは安全な案内を表示し、入力と既存ユーザーを保つ', async ({ page }, testInfo) => {
    const identifier = `${testInfo.project.name}-${String(testInfo.parallelIndex)}-${String(Date.now())}`;
    const existingName = `Existing User ${identifier}`;
    const duplicateName = `Duplicate User ${identifier}`;
    const email = `duplicate-user-${identifier}@example.com`;

    // D1 準備処理中の一時的な HTTP 応答を避け、公開 API が利用可能になってから顧客経路の準備を始める。
    await expect
      .poll(async () => (await page.request.get('/api/v1/users')).status(), { timeout: 30000 })
      .toBe(200);

    // 公開 API で既存ユーザーを用意し、画面を再読込して重複送信前の一覧へ反映する。
    const createResponse = await page.request.post('/api/v1/users', {
      data: { email, name: existingName },
    });
    expect(createResponse.status()).toBe(201);
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: email })).toContainText(existingName);

    // 同じメールアドレスを別名で送信し、利用者へ内部情報を含まない重複案内が見えることを確認する。
    await page.getByPlaceholder('Name').fill(duplicateName);
    await page.getByPlaceholder('Email').fill(email);
    await page.getByRole('button', { name: /create user/i }).click();
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toContainText('User could not be created');
    await expect(errorAlert).toContainText(
      'A user with this email address already exists. Enter a different email address and try again.'
    );

    // 修正に必要な入力を保持し、一覧には登録済みの一件だけが残ることを同じ画面で確認する。
    await expect(page.getByPlaceholder('Name')).toHaveValue(duplicateName);
    await expect(page.getByPlaceholder('Email')).toHaveValue(email);
    const matchingRows = page.getByRole('row').filter({ hasText: email });
    await expect(matchingRows).toHaveCount(1);
    await expect(matchingRows).toContainText(existingName);
    await expect(page.getByText(duplicateName, { exact: true })).toHaveCount(0);
  });
});
