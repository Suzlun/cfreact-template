import { readFile } from 'node:fs/promises';
import path from 'node:path';

const operationMethods = new Set([
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
]);

const resourceTagPattern = /^[a-z][a-z\d]*(?:-[a-z\d]+)*$/u;
const operationIdPattern = /^[A-Za-z_][A-Za-z\d_]*$/u;

/**
 * 指定したルートから解決したパスが、そのルート外へ出ないことを確認する。
 *
 * @param {string} intendedRoot 入出力を許可するルートディレクトリ。
 * @param {...string} segments ルートから解決するパス要素。
 * @returns {string} 絶対パスへ解決し、境界内であることを確認したパス。
 * @throws パスが意図したルートの外側を指す場合に失敗する。
 *
 * @example
 * ```js
 * const file = resolvePathWithinRoot('/repo/generated', 'users', 'users.ts');
 * ```
 */
export const resolvePathWithinRoot = (intendedRoot, ...segments) => {
  // ルートと候補を同じ絶対パス表現へ揃え、相対パス要素による境界外参照を判定できるようにする。
  const resolvedRoot = path.resolve(intendedRoot);
  const resolvedPath = path.resolve(resolvedRoot, ...segments);
  const relativePath = path.relative(resolvedRoot, resolvedPath);

  // 別ドライブの絶対パスと `..` から始まる経路を拒否し、ルート自身または配下だけを受理する。
  if (
    path.isAbsolute(relativePath) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`)
  ) {
    throw new Error(`Resolved path escapes intended root: ${resolvedPath}`);
  }

  return resolvedPath;
};

/**
 * OpenAPI 文書からバックエンドハンドラーを必要とする操作を抽出する。
 *
 * @param {string} openApiPath 読み込む OpenAPI JSON の絶対パス。
 * @returns {Promise<Array<{ route: string, method: string, tag: string, operationId: string, handlerPath: string }>>}
 * 単一のリソースタグと `operationId` を持つ操作を、文書内の順序で返す。
 * @throws OpenAPI JSON を読めない場合、操作のタグまたは `operationId` が不正な場合、同じハンドラーパスを
 * 複数の操作が要求する場合に失敗する。
 *
 * @example
 * ```js
 * const operations = await readOpenApiOperations('/repo/packages/typespec/openapi/openapi.json');
 * ```
 */
export const readOpenApiOperations = async (openApiPath) => {
  // TypeSpec から生成された JSON だけを解析し、各利用側が method や tag の解釈を再実装しないようにする。
  const openApi = JSON.parse(await readFile(openApiPath, 'utf8'));
  const operations = [];
  const handlerSources = new Map();

  // Path Item のうち OpenAPI が定義する全 operation key を同じ規則で処理する。
  for (const [route, pathItem] of Object.entries(openApi.paths ?? {})) {
    if (pathItem == null || typeof pathItem !== 'object' || Array.isArray(pathItem)) {
      throw new Error(`OpenAPI path item must be an object: ${route}`);
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operationMethods.has(method)) {
        continue;
      }

      // `Orval` のリソースとスマートハンドラーを一意に決められる単一タグと `operationId` だけを受理する。
      const tags =
        operation != null && typeof operation === 'object' && !Array.isArray(operation)
          ? operation.tags
          : undefined;
      const operationId =
        operation != null && typeof operation === 'object' && !Array.isArray(operation)
          ? operation.operationId
          : undefined;
      const [tag] = Array.isArray(tags) ? tags : [];
      if (
        !Array.isArray(tags) ||
        tags.length !== 1 ||
        typeof tag !== 'string' ||
        !resourceTagPattern.test(tag) ||
        typeof operationId !== 'string' ||
        !operationIdPattern.test(operationId)
      ) {
        throw new Error(
          `Backend operation must have one safe lowercase kebab resource tag and a safe operationId: ${method.toUpperCase()} ${route}`
        );
      }

      // OS 固有の区切り文字に依存しない一覧キーを作り、同じ出力先の上書きを生成前に拒否する。
      const handlerPath = path.posix.join(tag, `${operationId}.ts`);
      const operationSource = `${method.toUpperCase()} ${route}`;
      const existingSource = handlerSources.get(handlerPath);
      if (existingSource !== undefined) {
        throw new Error(
          `Duplicate backend handler path "${handlerPath}" for ${existingSource} and ${operationSource}`
        );
      }

      handlerSources.set(handlerPath, operationSource);
      operations.push({ route, method, tag, operationId, handlerPath });
    }
  }

  return operations;
};
