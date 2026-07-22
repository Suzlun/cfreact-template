import { RuleTester } from 'eslint';

import { noLocalUiComponentShadow } from './rules/no-local-ui-component-shadow.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

const OPTIONS = [{ componentNames: ['Button', 'Dialog', 'Input'] }];

ruleTester.run('no-local-ui-component-shadow', noLocalUiComponentShadow, {
  valid: [
    {
      code: "import { Button } from '@cfreact-template/ui';\nconst ActionButton = () => <Button />;",
      options: OPTIONS,
    },
    {
      code: 'function UserDialog() { return <div />; }',
      options: OPTIONS,
    },
  ],
  invalid: [
    {
      code: 'function Button() { return <button />; }',
      options: OPTIONS,
      errors: [{ messageId: 'shadow', data: { name: 'Button' } }],
    },
    {
      code: 'const Dialog = () => <div role="dialog" />;',
      options: OPTIONS,
      errors: [{ messageId: 'shadow', data: { name: 'Dialog' } }],
    },
    {
      code: "export { LocalControl as Input } from './local-control';",
      options: OPTIONS,
      errors: [{ messageId: 'shadow', data: { name: 'Input' } }],
    },
    {
      code: "export { Button } from '@cfreact-template/ui';",
      options: OPTIONS,
      errors: [{ messageId: 'reexport' }],
    },
    {
      code: "import { Button } from '@cfreact-template/ui';\nexport { Button };",
      options: OPTIONS,
      errors: [{ messageId: 'reexport' }],
    },
    {
      code: "export * from '@cfreact-template/ui/components/dialog';",
      options: OPTIONS,
      errors: [{ messageId: 'reexport' }],
    },
  ],
});
