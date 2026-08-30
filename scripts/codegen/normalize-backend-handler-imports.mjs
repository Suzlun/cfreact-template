import { readFile, writeFile } from 'node:fs/promises';
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
const openApiRoot = resolvePathWithinRoot(
  repositoryRoot,
  readOption('--openapi', 'apps/main/typespec/openapi/openapi.json'),
  '..'
);
const handlersRoot = resolvePathWithinRoot(
  repositoryRoot,
  readOption('--modules', 'apps/main/src/backend/modules')
);
const openApiPath = await resolveExistingPathWithinRoot(
  repositoryRoot,
  openApiRoot,
  'openapi.json'
);

// 共通の OpenAPI 操作解析を使い、一覧検査と同じハンドラー集合だけを正規化する。
const expectedHandlers = await readOpenApiOperations(openApiPath);

// `Orval` 所有のコンテキストインポートだけを型専用インポートへ変換し、出力形状の変化は明示的に失敗させる。
for (const { tag, operationId } of expectedHandlers) {
  // OpenAPI 由来の各要素を絶対パスへ解決し、モジュールルート外のファイルを読み書きしない。
  const handlerPath = await resolveExistingPathWithinRoot(
    repositoryRoot,
    handlersRoot,
    tag,
    'handlers',
    `${operationId}.ts`
  );
  const source = await readFile(handlerPath, 'utf8');
  const contextName = `${operationId[0].toUpperCase()}${operationId.slice(1)}Context`;
  const contextSource = `../../../generated/api/${tag}/${tag}.context`;
  const valueImport = `import { ${contextName} } from '${contextSource}';`;
  const typeImport = `import type { ${contextName} } from '${contextSource}';`;
  const contextImports = source
    .split('\n')
    .filter((line) => line.startsWith('import') && line.includes('.context'));

  // 一つの既知 import 以外を受理せず、Orval 更新時の暗黙な不完全変換を防ぐ。
  if (
    contextImports.length !== 1 ||
    (contextImports[0] !== valueImport && contextImports[0] !== typeImport)
  ) {
    throw new Error(
      `Unexpected Orval context import in ${path.relative(repositoryRoot, handlerPath)}`
    );
  }

  const normalized = source.replace(valueImport, typeImport);
  if (!normalized.includes(typeImport) || normalized.includes(valueImport)) {
    throw new Error(
      `Failed to normalize Orval context import in ${path.relative(repositoryRoot, handlerPath)}`
    );
  }

  // 既に正規化済みなら書き込まず、連続生成で内容と更新時刻を安定させる。
  if (normalized !== source) {
    await writeFile(handlerPath, normalized);
  }
}
