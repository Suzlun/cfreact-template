import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../..');
const RENDER_SCRIPT_PATH = path.join(REPOSITORY_ROOT, 'scripts/release/render-release.mjs');
const VALIDATE_SCRIPT_PATH = path.join(REPOSITORY_ROOT, 'scripts/release/validate-release.mjs');
const ROOT_MANIFEST_PATH = 'package.json';

test('同一release内のChangesetを常に前回release版から一括計算する', () => {
  // 一時git repositoryでdevelop更新とmajor指定を再現し、累積patchを防ぐ統合経路を検証します。
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'cfreact-release-'));
  createFixture(fixtureRoot);

  git(fixtureRoot, ['init', '--initial-branch=develop']);
  git(fixtureRoot, ['config', 'user.name', 'Release Test']);
  git(fixtureRoot, ['config', 'user.email', 'release-test@example.com']);
  git(fixtureRoot, ['add', '.']);
  git(fixtureRoot, ['commit', '-m', 'chore: initialize fixture']);

  // 2件のpatchを同時に処理しても、1.0.0から1.0.1への1回だけのbumpになります。
  writeChangeset(fixtureRoot, 'first.md', '最初の修正');
  writeChangeset(fixtureRoot, 'second.md', '次の修正');
  git(fixtureRoot, ['add', '.changeset']);
  git(fixtureRoot, ['commit', '-m', 'fix: add two changesets']);
  git(fixtureRoot, ['switch', '-c', 'release']);
  render(fixtureRoot, ['--base-ref', 'develop', '--initialize']);
  assert.equal(readJson(fixtureRoot, ROOT_MANIFEST_PATH).version, '1.0.1');
  git(fixtureRoot, ['add', '.']);
  git(fixtureRoot, ['commit', '-m', 'chore: render first release']);

  // release中にpatchが増えてもdevelopの3件を再計算し、1.0.2へ累積しません。
  git(fixtureRoot, ['switch', 'develop']);
  writeChangeset(fixtureRoot, 'third.md', '追加の修正');
  git(fixtureRoot, ['add', '.changeset']);
  git(fixtureRoot, ['commit', '-m', 'fix: add another changeset']);
  git(fixtureRoot, ['switch', 'release']);
  git(fixtureRoot, ['merge', '--no-ff', '--no-edit', 'develop']);
  render(fixtureRoot, ['--base-ref', 'develop']);
  assert.equal(readJson(fixtureRoot, ROOT_MANIFEST_PATH).version, '1.0.1');

  // release planをmajorへ変更すると、同じChangeset集合を前回release版から2.0.0へ再生成します。
  writeJson(fixtureRoot, '.release/plan.json', {
    minimumBump: 'major',
    version: '1.0.1',
  });
  render(fixtureRoot, ['--base-ref', 'develop']);
  assert.equal(readJson(fixtureRoot, ROOT_MANIFEST_PATH).version, '2.0.0');
  assert.match(readFileSync(path.join(fixtureRoot, 'CHANGELOG.md'), 'utf8'), /## 2\.0\.0/);
  // 最終生成物が単一version、消費済みChangeset、CHANGELOG、develop祖先の全条件を満たすことを確認します。
  execFileSync(process.execPath, [VALIDATE_SCRIPT_PATH, '--develop-ref', 'develop'], {
    cwd: fixtureRoot,
    stdio: 'pipe',
  });
});

test('empty Changesetだけではrelease versionを生成しない', () => {
  // version不要の変更だけをdevelopへ取り込んでもrelease branchを作る入力にならないことを確認します。
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'cfreact-empty-release-'));
  createFixture(fixtureRoot);
  writeFileSync(path.join(fixtureRoot, '.changeset/empty.md'), '---\n---\n');
  git(fixtureRoot, ['init', '--initial-branch=develop']);
  git(fixtureRoot, ['config', 'user.name', 'Release Test']);
  git(fixtureRoot, ['config', 'user.email', 'release-test@example.com']);
  git(fixtureRoot, ['add', '.']);
  git(fixtureRoot, ['commit', '-m', 'chore: add empty changeset']);
  git(fixtureRoot, ['switch', '-c', 'release']);

  render(fixtureRoot, ['--base-ref', 'develop', '--initialize']);

  assert.equal(readJson(fixtureRoot, ROOT_MANIFEST_PATH).version, '1.0.0');
  assert.equal(existsSync(path.join(fixtureRoot, 'CHANGELOG.md')), false);
  assert.equal(existsSync(path.join(fixtureRoot, '.changeset/empty.md')), true);
});

function createFixture(root) {
  // 実repositoryと同じpnpm workspace、Changesets fixed group、release planを必要な範囲で再現します。
  mkdirSync(path.join(root, '.changeset'), { recursive: true });
  mkdirSync(path.join(root, '.release'), { recursive: true });
  mkdirSync(path.join(root, 'packages/a'), { recursive: true });
  mkdirSync(path.join(root, 'packages/b'), { recursive: true });
  writeJson(root, ROOT_MANIFEST_PATH, {
    name: 'fixture-app',
    version: '1.0.0',
    private: true,
    type: 'module',
    packageManager: 'pnpm@11.16.0',
  });
  writeJson(root, 'packages/a/package.json', { name: 'pkg-a', version: '1.0.0', private: true });
  writeJson(root, 'packages/b/package.json', { name: 'pkg-b', version: '1.0.0', private: true });
  writeJson(root, '.release/plan.json', { minimumBump: 'auto', version: '1.0.0' });
  writeJson(root, '.changeset/config.json', {
    changelog: '@changesets/cli/changelog',
    commit: false,
    fixed: [['**']],
    linked: [],
    access: 'restricted',
    baseBranch: 'develop',
    updateInternalDependencies: 'patch',
    ignore: [],
    privatePackages: { version: true, tag: false },
  });
  writeFileSync(path.join(root, '.changeset/README.md'), '# Changesets\n');
  writeFileSync(path.join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");
}

function writeChangeset(root, fileName, summary) {
  // fixtureの全patchは同じpackageを対象にし、fixed groupによる単一version更新を検証します。
  writeFileSync(
    path.join(root, '.changeset', fileName),
    `---\n"pkg-a": patch\n---\n\n${summary}\n`
  );
}

function render(root, arguments_) {
  // 本番と同じentrypointを子processで実行し、Changesets CLIとlockfile更新も含めて検証します。
  execFileSync(process.execPath, [RENDER_SCRIPT_PATH, ...arguments_], {
    cwd: root,
    stdio: 'pipe',
  });
}

function git(root, arguments_) {
  // fixtureのbranch履歴をgit CLIで構築し、実workflowと同じmerge意味論を使用します。
  execFileSync('git', arguments_, { cwd: root, stdio: 'pipe' });
}

function readJson(root, relativePath) {
  // 生成後manifestを構造として比較し、整形差分に依存しないassertionを行います。
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(root, relativePath, value) {
  // fixture設定をrepositoryと同じ2space JSONで書き、Changesetsとpnpmの入力を安定させます。
  writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}
