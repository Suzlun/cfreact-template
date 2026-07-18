import { RuleTester } from 'eslint';

import { noReactNamespaceImports } from './rules/no-react-namespace-imports.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run('no-react-namespace-imports', noReactNamespaceImports, {
  valid: ["import { useState } from 'react';", "import { createElement } from 'react';"],
  invalid: [
    {
      code: "import React from 'react';\nconst value = React.useEffect;",
      errors: [{ messageId: 'forbidden' }],
    },
    {
      code: "import * as R from 'react';\nconst value = R.useEffect;",
      errors: [{ messageId: 'forbidden' }],
    },
    {
      code: "import { default as R } from 'react';\nconst value = R.useEffect;",
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});
