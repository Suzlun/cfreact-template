import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { resolveExistingPathWithinRoot, resolvePathWithinRoot } from './openapi-operations.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const codegenRoots = [
  resolvePathWithinRoot(repositoryRoot, 'packages/typespec/openapi'),
  resolvePathWithinRoot(repositoryRoot, 'packages/backend/src/generated/api'),
  resolvePathWithinRoot(repositoryRoot, 'packages/backend/src/modules'),
  resolvePathWithinRoot(repositoryRoot, 'packages/frontend/src/api/generated'),
];

// 各生成ルートの実体がリポジトリ内にあることを生成前に確認し、ルートごとの所有境界を固定する。
for (const codegenRoot of codegenRoots) {
  const verifiedRoot = await resolveExistingPathWithinRoot(repositoryRoot, codegenRoot, '.');
  const entries = await readdir(verifiedRoot, { recursive: true, withFileTypes: true });

  // 生成器が再帰的に削除または上書きする範囲では、内外を問わずシンボリックリンクを受理しない。
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      const linkPath = path.relative(repositoryRoot, path.join(entry.parentPath, entry.name));
      throw new Error(`Code generation root contains a symbolic link: ${linkPath}`);
    }
  }
}
