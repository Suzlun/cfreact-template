import { RuleTester } from 'eslint';

import { noDirectUiPrimitives } from './rules/no-direct-ui-primitives.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

const OPTIONS = [
  {
    restrictions: [
      {
        match: 'package',
        value: '@base-ui/react',
        alternative: '@cfreact-template/ui',
      },
      {
        match: 'prefix',
        value: '@radix-ui/react-',
        alternative: '@cfreact-template/ui',
      },
      {
        match: 'exact',
        value: 'sonner',
        alternative: 'SonnerToaster',
      },
    ],
  },
];

ruleTester.run('no-direct-ui-primitives', noDirectUiPrimitives, {
  valid: [
    {
      code: "import { Button } from '@cfreact-template/ui';",
      options: OPTIONS,
    },
    {
      code: "import { format } from 'date-fns';",
      options: OPTIONS,
    },
  ],
  invalid: [
    {
      code: "import { Dialog } from '@base-ui/react/dialog';",
      options: OPTIONS,
      errors: [{ messageId: 'restricted' }],
    },
    {
      code: "export { Toast } from 'sonner';",
      options: OPTIONS,
      errors: [{ messageId: 'restricted' }],
    },
    {
      code: "export * from '@radix-ui/react-popover';",
      options: OPTIONS,
      errors: [{ messageId: 'restricted' }],
    },
    {
      code: "const module = import('@base-ui/react/button');",
      options: OPTIONS,
      errors: [{ messageId: 'restricted' }],
    },
  ],
});
