/**
 * OS差を吸収したファイル名を返し、許可されたworkspace相対パスと比較できるようにする。
 *
 * @param {string} filename ESLintが検査中の絶対または相対ファイル名。
 * @returns {string} 区切り文字を`/`へ統一したファイル名。
 */
function normalizeFilename(filename) {
  return filename.replaceAll('\\', '/');
}

/**
 * 検査中ファイルが専用境界として許可されたファイルか判定する。
 *
 * @param {string} filename 正規化済みの検査中ファイル名。
 * @param {string[]} allowedFiles workspace rootからの許可パス。
 * @returns {boolean} いずれかの許可パスと一致する場合はtrue。
 */
function isAllowedFile(filename, allowedFiles) {
  return allowedFiles.some(
    (allowedFile) => filename === allowedFile || filename.endsWith(`/${allowedFile}`)
  );
}

/**
 * 頻出するCompiler非互換APIを専用の小さな境界以外から直接利用できないようにする。
 */
const enforceLibraryBoundaries = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Compiler非互換APIの直接利用を専用境界へ限定する。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          boundaries: {
            type: 'array',
            items: {
              type: 'object',
              required: ['moduleName', 'restrictedImports', 'allowedFiles'],
              properties: {
                moduleName: { type: 'string' },
                restrictedImports: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  uniqueItems: true,
                },
                allowedFiles: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 1,
                  uniqueItems: true,
                },
                disabledRule: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      restricted:
        '{{moduleName}}の{{importName}}はCompiler非互換処理の専用境界{{allowedFiles}}からだけ利用してください。利用側は専用境界の公開APIを呼び出してください。',
    },
  },
  create(context) {
    const filename = normalizeFilename(context.filename);
    const boundaries = context.options[0]?.boundaries ?? [];

    /**
     * importまたはre-exportされた識別子が専用境界を迂回していないか検査する。
     *
     * @param {import('estree').Node} node 違反時に報告する構文ノード。
     * @param {string} moduleName import元module。
     * @param {string} importName importまたはre-exportする識別子。
     */
    function reportRestrictedImport(node, moduleName, importName) {
      const boundary = boundaries.find((candidate) => candidate.moduleName === moduleName);
      if (
        boundary === undefined ||
        !boundary.restrictedImports.includes(importName) ||
        isAllowedFile(filename, boundary.allowedFiles)
      ) {
        return;
      }

      context.report({
        node,
        messageId: 'restricted',
        data: {
          moduleName,
          importName,
          allowedFiles: boundary.allowedFiles.join(', '),
        },
      });
    }

    return {
      ImportDeclaration(node) {
        const moduleName = String(node.source.value);
        const boundary = boundaries.find((candidate) => candidate.moduleName === moduleName);
        if (boundary === undefined || isAllowedFile(filename, boundary.allowedFiles)) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') {
            for (const importName of boundary.restrictedImports) {
              reportRestrictedImport(specifier, moduleName, importName);
            }
            continue;
          }

          if (specifier.type === 'ImportSpecifier') {
            const importName =
              specifier.imported.type === 'Identifier'
                ? specifier.imported.name
                : specifier.imported.value;
            reportRestrictedImport(specifier, moduleName, importName);
          }
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source === null) {
          return;
        }

        const moduleName = String(node.source.value);
        for (const specifier of node.specifiers) {
          const importName =
            specifier.local.type === 'Identifier' ? specifier.local.name : specifier.local.value;
          reportRestrictedImport(specifier, moduleName, importName);
        }
      },
      ExportAllDeclaration(node) {
        const moduleName = String(node.source.value);
        const boundary = boundaries.find((candidate) => candidate.moduleName === moduleName);
        if (boundary === undefined || isAllowedFile(filename, boundary.allowedFiles)) {
          return;
        }

        for (const importName of boundary.restrictedImports) {
          reportRestrictedImport(node, moduleName, importName);
        }
      },
    };
  },
};

export { enforceLibraryBoundaries };
