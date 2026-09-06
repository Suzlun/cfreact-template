import { execFileSync } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { build } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const targets = args.filter((arg) => arg !== '--check');
const apps = (await readdir(resolve(repositoryRoot, 'mockups'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (targets.length > 1 || (targets.length === 1 && !apps.includes(targets[0]))) {
  throw new Error(`Unknown mockup target: ${targets.join(' ')}. Available: ${apps.join(', ')}`);
}

const selected = targets.length === 0 ? apps : targets;
if (selected.length === 0) {
  throw new Error('No mockup apps found.');
}

// 全対象の入力を先に確認し、不完全な構成のまま生成物を更新しない。
for (const app of selected) {
  const appDirectory = resolve(repositoryRoot, 'apps', app);
  if (!(await stat(appDirectory)).isDirectory()) {
    throw new Error(`Missing app directory: ${appDirectory}`);
  }
  for (const input of ['index.html', 'src/main.tsx']) {
    const file = resolve(repositoryRoot, 'mockups', app, input);
    if (!(await stat(file)).isFile()) {
      throw new Error(`Missing mockup input: ${file}`);
    }
  }
}

for (const app of selected) {
  await build({
    configFile: resolve(repositoryRoot, 'mockups/vite.config.ts'),
    root: resolve(repositoryRoot, 'mockups', app),
  });
}

if (check) {
  const outputs = selected.map((app) => `mockups/${app}/dist`);
  const expected = outputs.flatMap((output) => [
    `${output}/prototype.js`,
    `${output}/prototype.css`,
  ]);
  const gitOptions = { cwd: repositoryRoot, encoding: 'utf8' };
  execFileSync('git', ['ls-files', '--error-unmatch', '--', ...expected], gitOptions);
  execFileSync('git', ['diff', '--quiet', '--', ...outputs], gitOptions);
  const untracked = execFileSync('git', ['ls-files', '--others', '--', ...outputs], gitOptions);
  if (untracked.length > 0) {
    throw new Error(`Untracked mockup output:\n${untracked}`);
  }
}
