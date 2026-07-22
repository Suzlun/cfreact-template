import assert from 'node:assert/strict';
import test from 'node:test';

import { inspectPublicUiCatalog, loadPublicUiComponentNames } from './public-component-catalog.mjs';

test('公開UIとStorybook catalogが一致する', () => {
  // repositoryの実ファイルを契約fixtureとして読み、追加・削除時の更新漏れを同じ検査経路で捕捉する。
  const catalog = inspectPublicUiCatalog();

  assert.deepEqual(catalog.diagnostics, []);
  assert.equal(catalog.targets.length, 64);
});

test('barrel aliasと複合コンポーネントを公開UI名として解決する', () => {
  // Storyのmeta.componentだけでは得られない名前もsource exportとbarrelから取得できることを保証する。
  const componentNames = loadPublicUiComponentNames();

  assert.ok(componentNames.includes('Button'));
  assert.ok(componentNames.includes('DataTable'));
  assert.ok(componentNames.includes('FormField'));
  assert.ok(componentNames.includes('InputOTPSlot'));
  assert.ok(componentNames.includes('SonnerToaster'));
});
