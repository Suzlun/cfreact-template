const REQUIRED_FIELDS = ['理由', '検討した代替案', '不採用理由', '再評価条件'];
const PLACEHOLDER_PATTERN = /(?:TODO|TBD|FIXME|不明|仮対応|一時対応|あとで|後で)/iu;
const DEFAULT_MINIMUM_FIELD_LENGTH = 15;

/**
 * block commentの行頭装飾を除去し、構造化された説明文として正規化する。
 *
 * @param {string} rawDescription ESLintディレクティブの`--`以降。
 * @returns {string[]} 空行を除いた説明行。
 */
function normalizeDescriptionLines(rawDescription) {
  return rawDescription
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').trim())
    .filter((line) => line !== '');
}

/**
 * 必須ラベルと継続行を読み取り、各検討内容を1つの文章へまとめる。
 *
 * @param {string[]} lines 正規化済みの説明行。
 * @returns {{ values: Map<string, string>; order: string[]; unexpectedPrefix: boolean }} 解析結果。
 */
function parseStructuredFields(lines) {
  const values = new Map();
  const order = [];
  let currentField;
  let unexpectedPrefix = false;

  for (const line of lines) {
    const matchedField = REQUIRED_FIELDS.find((field) => line.startsWith(`${field}:`));
    if (matchedField !== undefined) {
      order.push(matchedField);
      values.set(matchedField, line.slice(matchedField.length + 1).trim());
      currentField = matchedField;
      continue;
    }

    if (currentField === undefined) {
      unexpectedPrefix = true;
      continue;
    }

    const currentValue = values.get(currentField) ?? '';
    values.set(currentField, `${currentValue} ${line}`.trim());
  }

  return { values, order, unexpectedPrefix };
}

/**
 * 文字数検査では改行や空白を説明量として数えない。
 *
 * @param {string} value 検査対象の説明。
 * @returns {number} 空白を除いたUnicodeコードポイント数。
 */
function getContentLength(value) {
  return [...value.replaceAll(/\s/gu, '')].length;
}

/**
 * eslint-disable-next-lineへ具体的な検討記録を必須化する。
 */
const requireDisableJustification = {
  meta: {
    type: 'problem',
    docs: {
      description: 'eslint-disable-next-lineへ構造化された詳細理由を必須化する。',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedRules: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          minimumFieldLength: {
            type: 'integer',
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      oneRule:
        'eslint-disable-next-lineは許可された1ルールだけを指定してください。複数ルールや全ルールの無効化は禁止です。',
      disallowedRule:
        '{{ruleName}}はinline無効化の許可リストにありません。境界・型安全性・セキュリティのルールは無効化できません。',
      invalidStructure:
        '説明は「理由」「検討した代替案」「不採用理由」「再評価条件」の順に各1回記載してください。',
      shortField: '{{fieldName}}は空白を除いて{{minimum}}文字以上で具体的に記載してください。',
      placeholder:
        '{{fieldName}}に未確定表現や一時対応を記載できません。完結した判断と客観的な再評価条件を記載してください。',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const options = context.options[0] ?? {};
    const allowedRules = new Set(options.allowedRules ?? []);
    const minimumFieldLength = options.minimumFieldLength ?? DEFAULT_MINIMUM_FIELD_LENGTH;

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          const rawComment = comment.value.trim();
          if (!rawComment.startsWith('eslint-disable-next-line')) {
            continue;
          }

          const separatorIndex = rawComment.indexOf('--');
          const directive =
            separatorIndex === -1 ? rawComment : rawComment.slice(0, separatorIndex).trim();
          const rawDescription =
            separatorIndex === -1 ? '' : rawComment.slice(separatorIndex + 2).trim();
          const ruleNames = directive
            .slice('eslint-disable-next-line'.length)
            .split(',')
            .map((ruleName) => ruleName.trim())
            .filter((ruleName) => ruleName !== '');

          if (ruleNames.length !== 1) {
            context.report({ node: comment, messageId: 'oneRule' });
            continue;
          }

          const [ruleName] = ruleNames;
          if (ruleName === undefined || !allowedRules.has(ruleName)) {
            context.report({
              node: comment,
              messageId: 'disallowedRule',
              data: { ruleName: ruleName ?? '全ルール' },
            });
            continue;
          }

          const parsed = parseStructuredFields(normalizeDescriptionLines(rawDescription));
          const hasExactOrder = REQUIRED_FIELDS.every(
            (field, index) => parsed.order.at(index) === field
          );
          const hasSingleOccurrence = new Set(parsed.order).size === REQUIRED_FIELDS.length;
          if (
            parsed.unexpectedPrefix ||
            parsed.order.length !== REQUIRED_FIELDS.length ||
            !hasExactOrder ||
            !hasSingleOccurrence
          ) {
            context.report({ node: comment, messageId: 'invalidStructure' });
            continue;
          }

          for (const field of REQUIRED_FIELDS) {
            const value = parsed.values.get(field) ?? '';
            if (getContentLength(value) < minimumFieldLength) {
              context.report({
                node: comment,
                messageId: 'shortField',
                data: { fieldName: field, minimum: minimumFieldLength },
              });
            }
            if (PLACEHOLDER_PATTERN.test(value)) {
              context.report({
                node: comment,
                messageId: 'placeholder',
                data: { fieldName: field },
              });
            }
          }
        }
      },
    };
  },
};

export { requireDisableJustification };
