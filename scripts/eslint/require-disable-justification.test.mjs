import { RuleTester } from 'eslint';

import { requireDisableJustification } from './rules/require-disable-justification.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  linterOptions: {
    reportUnusedDisableDirectives: 'off',
  },
});

const TEST_RULE_OPTIONS = [{ allowedRules: ['no-console'], minimumFieldLength: 10 }];

const validDescription = `
/* eslint-disable-next-line no-console --
 * 理由: 外部ランタイムが要求する監査ログをこの呼び出し位置で必ず記録するため。
 * 検討した代替案: 構造化ロガーへ委譲し、アダプター層だけで出力する方法を検討した。
 * 不採用理由: このテスト対象では外部ランタイムのconsole呼び出し自体が契約だから。
 * 再評価条件: 外部ランタイムが構造化ロガーを受け取る公開APIを提供した時点で削除する。
 */
console.log('audit');
`;

ruleTester.run('require-disable-justification', requireDisableJustification, {
  valid: [
    {
      code: validDescription,
      options: TEST_RULE_OPTIONS,
    },
  ],
  invalid: [
    {
      code: `
// eslint-disable-next-line no-console -- 理由: consoleが必要なため。
console.log('audit');
`,
      options: TEST_RULE_OPTIONS,
      errors: [{ messageId: 'invalidStructure' }],
    },
    {
      code: validDescription.replace('no-console', 'no-alert'),
      options: TEST_RULE_OPTIONS,
      errors: [{ messageId: 'disallowedRule' }],
    },
    {
      code: validDescription.replace('no-console', 'no-console, no-alert'),
      options: TEST_RULE_OPTIONS,
      errors: [{ messageId: 'oneRule' }],
    },
    {
      code: validDescription.replace(
        '外部ランタイムが要求する監査ログをこの呼び出し位置で必ず記録するため。',
        '短い理由。'
      ),
      options: TEST_RULE_OPTIONS,
      errors: [{ messageId: 'shortField' }],
    },
    {
      code: validDescription.replace(
        '外部ランタイムが構造化ロガーを受け取る公開APIを提供した時点で削除する。',
        'TODOとして更新時に確認する。'
      ),
      options: TEST_RULE_OPTIONS,
      errors: [{ messageId: 'placeholder' }],
    },
  ],
});
