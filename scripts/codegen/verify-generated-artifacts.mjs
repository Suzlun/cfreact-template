import { spawnSync } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { readOpenApiOperations, resolvePathWithinRoot } from './openapi-operations.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const openApiRoot = resolvePathWithinRoot(repositoryRoot, 'packages/typespec/openapi');
const backendGeneratedRoot = resolvePathWithinRoot(
  repositoryRoot,
  'packages/backend/src/generated/api'
);
const modulesRoot = resolvePathWithinRoot(repositoryRoot, 'packages/backend/src/modules');
const frontendGeneratedRoot = resolvePathWithinRoot(
  repositoryRoot,
  'packages/frontend/src/api/generated'
);

/**
 * 生成物ルート配下の現在のファイルを再帰的に列挙する。
 *
 * @param {string} intendedRoot 入出力を許可する生成物ルート。
 * @param {string} relativeRoot 許可ルートから見た生成物ディレクトリ。
 * @param {boolean} required ディレクトリと一件以上のファイルを必須にするか。
 * @returns {Promise<string[]>} Git のパス表現に揃えた、並べ替え済みのファイル一覧。
 * @throws 必須ディレクトリが存在しない場合、または必須ディレクトリが空の場合に失敗する。
 */
const collectFiles = async (intendedRoot, relativeRoot, required) => {
  // 列挙前に絶対パスへ解決し、生成物ルート外のディレクトリを読み取らない。
  const absoluteRoot = resolvePathWithinRoot(intendedRoot, relativeRoot);
  let entries;
  try {
    // Node.js 標準の再帰列挙を使い、生成器ごとの固定ファイル名へ依存しない。
    entries = await readdir(absoluteRoot, { recursive: true, withFileTypes: true });
  } catch (error) {
    if (!required && error != null && typeof error === 'object' && error.code === 'ENOENT') {
      return [];
    }
    throw new Error(`Required generated directory is missing: ${relativeRoot}`, { cause: error });
  }

  // `Dirent#parentPath` から実ファイルだけを復元し、OS 固有区切りを Git の `/` へ統一する。
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(repositoryRoot, path.join(entry.parentPath, entry.name)))
    .map((file) => file.split(path.sep).join('/'))
    .sort();
  if (required && files.length === 0) {
    throw new Error(`Required generated directory is empty: ${relativeRoot}`);
  }

  return files;
};

/**
 * 必須生成ファイルが通常ファイルとして存在することを確認する。
 *
 * @param {string} intendedRoot 入力を許可する生成物ルート。
 * @param {string} relativeFile 許可ルートから見た必須ファイル。
 * @returns {Promise<string>} Git のパス表現に揃えた必須ファイルのパス。
 * @throws ファイルが存在しない場合、または通常ファイルでない場合に失敗する。
 */
const requireFile = async (intendedRoot, relativeFile) => {
  // stat の前に対象を絶対パスへ解決し、意図した生成物ルートの外側を参照しない。
  const absoluteFile = resolvePathWithinRoot(intendedRoot, relativeFile);
  let fileStats;
  try {
    fileStats = await stat(absoluteFile);
  } catch (error) {
    throw new Error(`Required generated artifact is missing: ${relativeFile}`, { cause: error });
  }
  if (!fileStats.isFile()) {
    throw new Error(`Required generated artifact is not a file: ${relativeFile}`);
  }

  return path.relative(repositoryRoot, absoluteFile).split(path.sep).join('/');
};

// OpenAPI 操作から必須ハンドラーとリソースディレクトリを決め、生成物名そのものは実ファイルから取得する。
const operations = await readOpenApiOperations(resolvePathWithinRoot(openApiRoot, 'openapi.json'));
const resourceTags = [...new Set(operations.map(({ tag }) => tag))].sort();
const requiredFileLocations = [
  { root: openApiRoot, file: 'openapi.json' },
  { root: backendGeneratedRoot, file: 'openapi.ts' },
  { root: frontendGeneratedRoot, file: 'client.ts' },
  ...operations.map(({ tag, operationId }) => ({
    root: modulesRoot,
    file: path.join(tag, 'handlers', `${operationId}.ts`),
  })),
];
const requiredFiles = [];
for (const { root, file } of requiredFileLocations) {
  requiredFiles.push(await requireFile(root, file));
}

// すべての期待リソースに生成結果があることを確認し、現在の生成物を漏れなく Git 管理確認へ渡す。
const artifactFiles = new Set(requiredFiles);
for (const tag of resourceTags) {
  for (const file of await collectFiles(backendGeneratedRoot, tag, true)) {
    artifactFiles.add(file);
  }
}
for (const root of [openApiRoot, backendGeneratedRoot, frontendGeneratedRoot]) {
  for (const file of await collectFiles(root, '.', true)) {
    artifactFiles.add(file);
  }
}

// OpenAPI に存在しないリソースのハンドラーも含め、実在する全ハンドラールートのファイルを検査する。
const modules = await readdir(modulesRoot, { withFileTypes: true });
for (const moduleEntry of modules.filter((entry) => entry.isDirectory())) {
  const handlersRoot = path.join(moduleEntry.name, 'handlers');
  for (const file of await collectFiles(modulesRoot, handlersRoot, false)) {
    artifactFiles.add(file);
  }
}

// インデックスと作業ツリーの両方を知る Git 自身から、現在管理対象として認識されているパスを取得する。
const gitResult = spawnSync('git', ['ls-files', '--cached', '-z'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
});
if (gitResult.status !== 0) {
  throw new Error(`Unable to read tracked files from Git: ${gitResult.stderr.trim()}`);
}
const trackedFiles = new Set(gitResult.stdout.split('\0').filter((file) => file !== ''));
const untrackedArtifacts = [...artifactFiles].filter((file) => !trackedFiles.has(file)).sort();

// `git diff` に現れない未追跡生成物を明示的に拒否し、ステージ済みの新規生成物は Git 管理済みとして受理する。
if (untrackedArtifacts.length > 0) {
  throw new Error(`Generated artifacts are not tracked by Git: ${untrackedArtifacts.join(', ')}`);
}
