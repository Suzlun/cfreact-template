import { RuleTester } from 'eslint';

import { enforceLibraryBoundaries } from './rules/enforce-library-boundaries.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

const BOUNDARY_OPTIONS = [
  {
    boundaries: [
      {
        moduleName: '@tanstack/react-table',
        restrictedImports: ['getCoreRowModel', 'useReactTable'],
        allowedFiles: ['packages/ui/components/data-table-model.ts'],
        disabledRule: 'react-hooks/incompatible-library',
      },
    ],
  },
];

ruleTester.run('enforce-library-boundaries', enforceLibraryBoundaries, {
  valid: [
    {
      filename: '/workspace/packages/ui/components/data-table-model.ts',
      code: "import { getCoreRowModel, useReactTable } from '@tanstack/react-table';",
      options: BOUNDARY_OPTIONS,
    },
    {
      filename: '/workspace/packages/ui/components/data-table.tsx',
      code: "import { flexRender } from '@tanstack/react-table';",
      options: BOUNDARY_OPTIONS,
    },
  ],
  invalid: [
    {
      filename: '/workspace/packages/frontend/src/app/pages/users/UsersPage.tsx',
      code: "import { useReactTable } from '@tanstack/react-table';",
      options: BOUNDARY_OPTIONS,
      errors: [{ messageId: 'restricted' }],
    },
    {
      filename: '/workspace/packages/ui/components/another-table.tsx',
      code: "export { getCoreRowModel } from '@tanstack/react-table';",
      options: BOUNDARY_OPTIONS,
      errors: [{ messageId: 'restricted' }],
    },
  ],
});
