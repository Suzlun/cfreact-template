import { RuleTester } from 'eslint';

import { noManualMemoization } from './rules/no-manual-memoization.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-manual-memoization', noManualMemoization, {
  valid: [
    "import { useState } from 'react';\nconst state = useState(0);",
    'const derived = values.filter((value) => value.active);',
  ],
  invalid: [
    {
      code: "import { useMemo } from 'react';\nconst value = useMemo(() => 1, []);",
      errors: [{ messageId: 'forbidden', data: { name: 'useMemo' } }],
    },
    {
      code: "import { useCallback as keepReference } from 'react';\nconst action = keepReference(() => 1, []);",
      errors: [{ messageId: 'forbidden', data: { name: 'useCallback' } }],
    },
    {
      code: "import * as React from 'react';\nconst Component = React.memo(() => null);",
      errors: [{ messageId: 'forbidden', data: { name: 'React.memo' } }],
    },
    {
      code: "import * as R from 'react';\nconst value = R.useMemo(() => 1, []);",
      errors: [{ messageId: 'forbidden', data: { name: 'R.useMemo' } }],
    },
    {
      code: "import R from 'react';\nconst R2 = R;\nconst action = R2.useCallback(() => 1, []);",
      errors: [{ messageId: 'forbidden', data: { name: 'R2.useCallback' } }],
    },
    {
      code: "import { default as R } from 'react';\nconst value = R.useMemo(() => 1, []);",
      errors: [{ messageId: 'forbidden', data: { name: 'R.useMemo' } }],
    },
    {
      code: "import * as R from 'react';\nconst { memo: cache } = R;\nconst Component = cache(() => null);",
      errors: [{ messageId: 'forbidden', data: { name: 'R.memo' } }],
    },
  ],
});
