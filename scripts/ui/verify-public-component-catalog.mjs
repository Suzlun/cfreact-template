import process from 'node:process';

import { inspectPublicUiCatalog } from './public-component-catalog.mjs';

// ESLintとStorybookが共有する公開UI catalogを検査し、CIが読める一行単位の診断へ整形する。
const catalog = inspectPublicUiCatalog();

if (catalog.diagnostics.length > 0) {
  process.stderr.write('公開UI catalogの整合性検査に失敗しました。\n');
  for (const diagnostic of catalog.diagnostics) {
    process.stderr.write(`- ${diagnostic}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(
    `公開UI catalog: ${catalog.targets.length}ファイル、${catalog.componentNames.length}コンポーネントを検証しました。`
  );
}
