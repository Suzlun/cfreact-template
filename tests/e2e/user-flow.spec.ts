import { test, expect, type Page, type TestInfo } from '@playwright/test';

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
});
