import { glob, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  readOpenApiOperations,
  resolveExistingPathWithinRoot,
  resolvePathWithinRoot,
} from './openapi-operations.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const arguments_ = process.argv.slice(2);
const readOption = (name, fallback) => {
  const optionIndex = arguments_.indexOf(name);
  if (optionIndex === -1) {
    return fallback;
  }
  const value = arguments_[optionIndex + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${name} requires a repository-relative path.`);
  }
  return value;
};
const openApiFile = readOption(
  '--openapi',
  'apps/main/typespec/openapi/openapi.json'
);
const openApiRoot = resolvePathWithinRoot(repositoryRoot, path.dirname(openApiFile));
const modulesPath = resolvePathWithinRoot(
  repositoryRoot,
  readOption('--modules', 'apps/main/src/backend/modules')
);
const generatedApiPath = resolvePathWithinRoot(
  repositoryRoot,
  readOption('--generated', 'apps/main/src/backend/generated/api')
);
const openApiPath = await resolveExistingPathWithinRoot(
  repositoryRoot,
  openApiRoot,
  path.basename(openApiFile)
);
const verifiedModulesPath = await resolveExistingPathWithinRoot(repositoryRoot, modulesPath, '.');
const verifiedGeneratedApiPath = await resolveExistingPathWithinRoot(
  repositoryRoot,
  generatedApiPath,
  '.'
);

// 共通解析結果から期待ハンドラーと有効なリソースタグを作り、検査側で OpenAPI の解釈を重複させない。
const operations = await readOpenApiOperations(openApiPath);
const expectedHandlers = new Set(operations.map(({ handlerPath }) => handlerPath));
const expectedResources = new Set(operations.map(({ tag }) => tag));

// 現在 OpenAPI に存在しないリソースも検出できるよう、実在する全モジュールのハンドラーを列挙する。
const actualHandlerFiles = [];
for await (const handlerFile of glob('*/handlers/**/*.ts', { cwd: verifiedModulesPath })) {
  // `Node.js` が返す OS 固有区切りを一覧と同じ POSIX 表現へ揃え、`Windows` でも同じ比較結果にする。
  actualHandlerFiles.push(handlerFile.split(path.sep).join('/'));
}
actualHandlerFiles.sort();

// `<resource>/handlers/file.ts` を一覧の `<resource>/file.ts` へ揃え、入れ子の残骸も余分として扱う。
const actualHandlers = new Set(
  actualHandlerFiles.map((handlerFile) => handlerFile.replace('/handlers/', '/'))
);
const missing = [...expectedHandlers].filter((handler) => !actualHandlers.has(handler)).sort();
const extra = [...actualHandlers].filter((handler) => !expectedHandlers.has(handler)).sort();

// 共有型の `openapi.ts` は許可しつつ、契約から消えたリソースの生成ディレクトリを残さない。
const generatedEntries = await readdir(verifiedGeneratedApiPath, { withFileTypes: true });
const extraGeneratedResources = generatedEntries
  .filter((entry) => entry.isDirectory() && !expectedResources.has(entry.name))
  .map((entry) => entry.name)
  .sort();

// 不足・余分・生成リソースの残骸のいずれも、生成設定または削除処理の不整合として失敗させる。
if (missing.length > 0 || extra.length > 0 || extraGeneratedResources.length > 0) {
  const details = [
    ...(missing.length > 0 ? [`missing: ${missing.join(', ')}`] : []),
    ...(extra.length > 0 ? [`extra: ${extra.join(', ')}`] : []),
    ...(extraGeneratedResources.length > 0
      ? [`extra generated resources: ${extraGeneratedResources.join(', ')}`]
      : []),
  ];
  throw new Error(
    `Backend handler manifest does not match OpenAPI operations (${details.join('; ')})`
  );
}
