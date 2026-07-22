/**
 * module名が共有UI内部へ閉じ込める依存の指定方法に一致するか判定する。
 *
 * @param {string} moduleName importまたはre-export元のmodule名。
 * @param {{ match: 'exact' | 'package' | 'prefix'; value: string }} restriction 禁止moduleの指定。
 * @returns {boolean} 指定moduleが禁止対象の場合はtrue。
 */
function matchesRestriction(moduleName, restriction) {
  if (restriction.match === 'exact') {
    return moduleName === restriction.value;
  }
  if (restriction.match === 'prefix') {
    return moduleName.startsWith(restriction.value);
  }
  return moduleName === restriction.value || moduleName.startsWith(`${restriction.value}/`);
}

/**
 * 共有UIが内包するprimitive・sanitizer・style実装をfrontendから直接利用できないようにする。
 */
const noDirectUiPrimitives = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '共有UI内部の実装依存をfrontendから直接importまたはre-exportすることを禁止する。',
    },
    schema: [
      {
        type: 'object',
        required: ['restrictions'],
        properties: {
          restrictions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['match', 'value', 'alternative'],
              properties: {
                match: { enum: ['exact', 'package', 'prefix'] },
                value: { type: 'string', minLength: 1 },
                alternative: { type: 'string', minLength: 1 },
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
        '{{moduleName}}は共有UI境界の内部実装です。直接利用せず、{{alternative}}を利用してください。',
    },
  },
  create(context) {
    const restrictions = context.options[0]?.restrictions ?? [];

    /**
     * 静的に判明するmodule名を検査し、対応する共有UI代替先を診断へ含める。
     *
     * @param {import('estree').Node} node 違反位置として報告する構文ノード。
     * @param {unknown} sourceValue import、export、dynamic importが参照する値。
     */
    function reportRestrictedModule(node, sourceValue) {
      if (typeof sourceValue !== 'string') {
        return;
      }

      const restriction = restrictions.find((candidate) =>
        matchesRestriction(sourceValue, candidate)
      );
      if (restriction === undefined) {
        return;
      }

      context.report({
        node,
        messageId: 'restricted',
        data: {
          moduleName: sourceValue,
          alternative: restriction.alternative,
        },
      });
    }

    return {
      ImportDeclaration(node) {
        reportRestrictedModule(node.source, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source !== null) {
          reportRestrictedModule(node.source, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        reportRestrictedModule(node.source, node.source.value);
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') {
          reportRestrictedModule(node.source, node.source.value);
        }
      },
    };
  },
};

export { noDirectUiPrimitives };
