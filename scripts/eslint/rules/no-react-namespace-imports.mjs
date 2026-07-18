import { isAliasedDefaultImport } from './react-imports.mjs';

/**
 * app層でReactのdefault/namespace value importを禁止し、Hook制約の別名迂回を防ぐ。
 */
const noReactNamespaceImports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'app層のReact組み込みHook制約を迂回する名前空間importを禁止する。',
    },
    schema: [],
    messages: {
      forbidden:
        'app層ではReactのdefault/namespace value importを使用できません。許可された値はnamed import、型はimport typeで参照してください。',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'react' || node.importKind === 'type') {
          return;
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportDefaultSpecifier' ||
            specifier.type === 'ImportNamespaceSpecifier' ||
            (specifier.type === 'ImportSpecifier' && isAliasedDefaultImport(specifier))
          ) {
            context.report({ node: specifier, messageId: 'forbidden' });
          }
        }
      },
    };
  },
};

export { noReactNamespaceImports };
