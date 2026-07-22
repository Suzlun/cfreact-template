const SHARED_UI_MODULE = '@cfreact-template/ui';

/**
 * moduleが共有UIのrootまたは公開subpathを指すか判定する。
 *
 * @param {unknown} sourceValue importまたはre-export元の値。
 * @returns {boolean} 共有UIの公開moduleの場合はtrue。
 */
function isSharedUiModule(sourceValue) {
  return (
    typeof sourceValue === 'string' &&
    (sourceValue === SHARED_UI_MODULE || sourceValue.startsWith(`${SHARED_UI_MODULE}/`))
  );
}

/**
 * packages/uiで公開済みの名前をfrontend app内で再宣言・再公開することを禁止する。
 */
const noLocalUiComponentShadow = {
  meta: {
    type: 'problem',
    docs: {
      description: '共有UIと同名のローカル値宣言、およびapp経由のUI再公開を禁止する。',
    },
    schema: [
      {
        type: 'object',
        required: ['componentNames'],
        properties: {
          componentNames: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      shadow:
        '{{name}}はpackages/uiですでに公開されています。ローカル実装を作らず、@cfreact-template/uiから利用してください。',
      reexport:
        '共有UIをfrontend appから再exportしないでください。利用側は@cfreact-template/uiの公開APIを直接importしてください。',
    },
  },
  create(context) {
    const componentNames = new Set(context.options[0]?.componentNames ?? []);
    const sharedUiImportNames = new Set();

    /**
     * 宣言名が共有UIの公開名と衝突する場合だけ、元の宣言位置へ診断を付ける。
     *
     * @param {import('estree').Identifier | null | undefined} identifier 検査対象の宣言名。
     */
    function reportShadow(identifier) {
      if (identifier === null || identifier === undefined || !componentNames.has(identifier.name)) {
        return;
      }

      context.report({
        node: identifier,
        messageId: 'shadow',
        data: { name: identifier.name },
      });
    }

    return {
      ImportDeclaration(node) {
        if (!isSharedUiModule(node.source.value)) {
          return;
        }

        // 後続の`export { Button }`も迂回barrelとして検知できるよう、local binding名を保持する。
        for (const specifier of node.specifiers) {
          sharedUiImportNames.add(specifier.local.name);
        }
      },
      FunctionDeclaration(node) {
        reportShadow(node.id);
      },
      ClassDeclaration(node) {
        reportShadow(node.id);
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') {
          reportShadow(node.id);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source !== null && isSharedUiModule(node.source.value)) {
          context.report({ node: node.source, messageId: 'reexport' });
          return;
        }

        for (const specifier of node.specifiers) {
          const localName =
            specifier.local.type === 'Identifier' ? specifier.local.name : specifier.local.value;
          const exportedName =
            specifier.exported.type === 'Identifier'
              ? specifier.exported.name
              : specifier.exported.value;

          // 共有UIからimportしたbindingの再公開と、別実装を共有UI名へ変えるaliasの両方を拒否する。
          if (sharedUiImportNames.has(localName)) {
            context.report({ node: specifier, messageId: 'reexport' });
          } else if (componentNames.has(exportedName)) {
            context.report({
              node: specifier,
              messageId: 'shadow',
              data: { name: exportedName },
            });
          }
        }
      },
      ExportAllDeclaration(node) {
        if (isSharedUiModule(node.source.value)) {
          context.report({ node: node.source, messageId: 'reexport' });
        }
      },
    };
  },
};

export { noLocalUiComponentShadow };
