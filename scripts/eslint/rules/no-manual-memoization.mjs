import { isAliasedDefaultImport } from './react-imports.mjs';

const MANUAL_MEMOIZATION_IMPORTS = new Set(['memo', 'useCallback', 'useMemo']);
const MANUAL_MEMOIZATION_MEMBERS = new Set(['memo', 'useCallback', 'useMemo']);

/**
 * React Compilerへ委譲すべき通常の手動メモ化を検出する。
 *
 * import時点で報告することで別名importも捕捉し、React名前空間経由の呼び出しは
 * CallExpressionで補完する。参照同一性が外部契約になる場合だけ、構造化した
 * eslint-disable-next-lineで対象importまたは呼び出しを局所的に許可する。
 */
const noManualMemoization = {
  meta: {
    type: 'problem',
    docs: {
      description: 'React Compilerへ委譲できる手動メモ化を禁止する。',
    },
    schema: [],
    messages: {
      forbidden:
        '{{name}}による通常の性能最適化は禁止です。React Compilerへ委譲し、参照同一性が外部契約になる場合だけ構造化した理由を記載してください。',
    },
  },
  create(context) {
    const reactNamespaceNames = new Set(['React']);

    /**
     * React名前空間のmember名を、computed accessを含めて取得する。
     *
     * @param {import('estree').MemberExpression} member React名前空間へのmember access。
     * @returns {string | undefined} 静的に特定できたmember名。
     */
    function getMemberName(member) {
      if (!member.computed && member.property.type === 'Identifier') {
        return member.property.name;
      }
      if (member.computed && member.property.type === 'Literal') {
        return typeof member.property.value === 'string' ? member.property.value : undefined;
      }
      return undefined;
    }

    /**
     * React名前空間経由の手動メモ化memberを検出して報告する。
     *
     * @param {import('estree').Node} reportNode 違反位置として報告するノード。
     * @param {import('estree').Expression} expression 検査対象の式。
     * @returns {boolean} 手動メモ化memberを報告した場合はtrue。
     */
    function reportMemoizationMember(reportNode, expression) {
      if (
        expression.type !== 'MemberExpression' ||
        expression.object.type !== 'Identifier' ||
        !reactNamespaceNames.has(expression.object.name)
      ) {
        return false;
      }

      const memberName = getMemberName(expression);
      if (memberName === undefined || !MANUAL_MEMOIZATION_MEMBERS.has(memberName)) {
        return false;
      }

      context.report({
        node: reportNode,
        messageId: 'forbidden',
        data: { name: `${expression.object.name}.${memberName}` },
      });
      return true;
    }

    return {
      Program(node) {
        // 子ノードを検査する前に全importを走査し、ファイル内で任意位置にある別名も登録する。
        for (const statement of node.body) {
          if (
            statement.type !== 'ImportDeclaration' ||
            statement.source.value !== 'react' ||
            statement.importKind === 'type'
          ) {
            continue;
          }
          for (const specifier of statement.specifiers) {
            if (
              specifier.type === 'ImportDefaultSpecifier' ||
              specifier.type === 'ImportNamespaceSpecifier' ||
              (specifier.type === 'ImportSpecifier' && isAliasedDefaultImport(specifier))
            ) {
              reactNamespaceNames.add(specifier.local.name);
            }
          }
        }
      },
      ImportDeclaration(node) {
        if (node.source.value !== 'react') {
          return;
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            MANUAL_MEMOIZATION_IMPORTS.has(specifier.imported.name)
          ) {
            context.report({
              node: specifier,
              messageId: 'forbidden',
              data: { name: specifier.imported.name },
            });
          }
        }
      },
      VariableDeclarator(node) {
        if (node.init === null) {
          return;
        }

        // `const R2 = R`のような名前空間aliasも後続呼び出しの検査対象へ加える。
        if (
          node.id.type === 'Identifier' &&
          node.init.type === 'Identifier' &&
          reactNamespaceNames.has(node.init.name)
        ) {
          reactNamespaceNames.add(node.id.name);
          return;
        }

        if (reportMemoizationMember(node, node.init)) {
          return;
        }

        // `const { useMemo: cache } = R`の分割代入でもimport名に基づいて禁止する。
        if (
          node.id.type === 'ObjectPattern' &&
          node.init.type === 'Identifier' &&
          reactNamespaceNames.has(node.init.name)
        ) {
          for (const property of node.id.properties) {
            if (
              property.type === 'Property' &&
              property.key.type === 'Identifier' &&
              MANUAL_MEMOIZATION_MEMBERS.has(property.key.name)
            ) {
              context.report({
                node: property,
                messageId: 'forbidden',
                data: { name: `${node.init.name}.${property.key.name}` },
              });
            }
          }
        }
      },
      CallExpression(node) {
        reportMemoizationMember(node.callee, node.callee);
      },
    };
  },
};

export { noManualMemoization };
