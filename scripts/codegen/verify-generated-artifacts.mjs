import { spawnSync } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import {
  readOpenApiOperations,
  resolveExistingPathWithinRoot,
  resolvePathWithinRoot,
} from './openapi-operations.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const generationTargets = [
  {
    openApiRoot: 'apps/main/typespec/openapi',
    backendGeneratedRoot: 'apps/main/src/backend/generated/api',
    modulesRoot: 'apps/main/src/backend/modules',
    clientGeneratedRoots: ['apps/main/src/frontend/api/generated'],
  },
  {
    openApiRoot: 'packages/core/typespec/openapi',
    backendGeneratedRoot: 'packages/core/src/generated/api',
    modulesRoot: 'packages/core/src/modules',
    clientGeneratedRoots: ['packages/core-sdk/src/generated'],
  },
].map((target) => ({
  openApiRoot: resolvePathWithinRoot(repositoryRoot, target.openApiRoot),
  backendGeneratedRoot: resolvePathWithinRoot(repositoryRoot, target.backendGeneratedRoot),
  modulesRoot: resolvePathWithinRoot(repositoryRoot, target.modulesRoot),
  clientGeneratedRoots: target.clientGeneratedRoots.map((root) =>
    resolvePathWithinRoot(repositoryRoot, root)
  ),
}));

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
  let absoluteRoot;
  let entries;
  try {
    absoluteRoot = await resolveExistingPathWithinRoot(repositoryRoot, intendedRoot, relativeRoot);
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
  let absoluteFile;
  let fileStats;
  try {
    absoluteFile = await resolveExistingPathWithinRoot(repositoryRoot, intendedRoot, relativeFile);
    fileStats = await stat(absoluteFile);
  } catch (error) {
    throw new Error(`Required generated artifact is missing: ${relativeFile}`, { cause: error });
  }
  if (!fileStats.isFile()) {
    throw new Error(`Required generated artifact is not a file: ${relativeFile}`);
  }

  return path.relative(repositoryRoot, absoluteFile).split(path.sep).join('/');
};

// 契約ごとに必須ハンドラーと生成ルートを検査し、全成果物を一つのGit管理確認へ集約する。
const artifactFiles = new Set();
for (const target of generationTargets) {
  const operations = await readOpenApiOperations(
    await resolveExistingPathWithinRoot(repositoryRoot, target.openApiRoot, 'openapi.json')
  );
  const resourceTags = [...new Set(operations.map(({ tag }) => tag))].sort();
  const requiredFileLocations = [
    { root: target.openApiRoot, file: 'openapi.json' },
    { root: target.backendGeneratedRoot, file: 'openapi.ts' },
    ...target.clientGeneratedRoots.map((root) => ({ root, file: 'client.ts' })),
    ...operations.map(({ tag, operationId }) => ({
      root: target.modulesRoot,
      file: path.join(tag, 'handlers', `${operationId}.ts`),
    })),
  ];
  for (const { root, file } of requiredFileLocations) {
    artifactFiles.add(await requireFile(root, file));
  }

  for (const tag of resourceTags) {
    for (const file of await collectFiles(target.backendGeneratedRoot, tag, true)) {
      artifactFiles.add(file);
    }
  }
  for (const root of [
    target.openApiRoot,
    target.backendGeneratedRoot,
    ...target.clientGeneratedRoots,
  ]) {
    for (const file of await collectFiles(root, '.', true)) {
      artifactFiles.add(file);
    }
  }

  const verifiedModulesRoot = await resolveExistingPathWithinRoot(
    repositoryRoot,
    target.modulesRoot,
    '.'
  );
  const modules = await readdir(verifiedModulesRoot, { withFileTypes: true });
  for (const moduleEntry of modules.filter((entry) => entry.isDirectory())) {
    const handlersRoot = path.join(moduleEntry.name, 'handlers');
    for (const file of await collectFiles(target.modulesRoot, handlersRoot, false)) {
      artifactFiles.add(file);
    }
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
