import js from '@eslint/js';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import boundaries from 'eslint-plugin-boundaries';
import eslintComments from 'eslint-plugin-eslint-comments';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ベース設定
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // 全体設定
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // グローバルルール設定
  {
    plugins: {
      import: importPlugin,
      unicorn: unicorn,
      'eslint-comments': eslintComments,
      boundaries: boundaries,
      security: security,
      sonarjs: sonarjs,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'boundaries/elements': [
        { type: 'server-entry', pattern: 'packages/server/src/index.ts' },
        { type: 'server-app', pattern: 'packages/server/src/app/**/*' },
        { type: 'server-adapters-http', pattern: 'packages/server/src/adapters/http/**/*' },
        {
          type: 'server-adapters-persistence',
          pattern: 'packages/server/src/adapters/persistence/**/*',
        },
        { type: 'server-core-domain', pattern: 'packages/server/src/core/domain/**/*' },
        { type: 'server-core-usecases', pattern: 'packages/server/src/core/usecases/**/*' },
        { type: 'server-types', pattern: 'packages/server/src/types.ts' },
        { type: 'client-api', pattern: 'packages/client/src/api/**/*' },
        { type: 'client-store', pattern: 'packages/client/src/store/**/*' },
        { type: 'client-hooks', pattern: 'packages/client/src/hooks/**/*' },
        { type: 'client-pages', pattern: 'packages/client/src/pages/**/*' },
        { type: 'client-components', pattern: 'packages/client/src/components/**/*' },
      ],
    },
    rules: {
      // ===== TypeScript 厳格化 =====
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      // ===== ESLint 無効化コメントの制限 =====
      'eslint-comments/no-unused-disable': 'error',
      'eslint-comments/disable-enable-pair': 'error',
      'eslint-comments/require-description': [
        'warn',
        {
          ignore: [],
        },
      ],
      // 完全禁止する場合は以下を有効化
      // 'eslint-comments/no-use': 'error',

      // ===== Import/Export =====
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // TypeScript が解決するのでオフ
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: '@cfreact-template/drizzle',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@client/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@server/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@ui/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@drizzle/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],

      // ===== Unicorn (厳選) =====
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/throw-new-error': 'error',

      // ===== Clean Architecture boundaries =====
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          message: 'Clean Architecture violation: %{from} is not allowed to import from %{target}.',
          rules: [
            {
              from: ['server-core-domain'],
              allow: ['server-core-domain', 'server-types'],
            },
            {
              from: ['server-types'],
              allow: ['server-types'],
            },
            {
              from: ['server-core-usecases'],
              allow: ['server-core-domain', 'server-core-usecases', 'server-types'],
            },
            {
              from: ['server-adapters-persistence'],
              allow: [
                'server-core-usecases',
                'server-core-domain',
                'server-types',
                'server-adapters-persistence',
              ],
            },
            {
              from: ['server-adapters-http'],
              allow: [
                'server-adapters-http',
                'server-core-usecases',
                'server-core-domain',
                'server-types',
              ],
            },
            {
              from: ['server-app'],
              allow: [
                'server-adapters-http',
                'server-adapters-persistence',
                'server-core-usecases',
                'server-core-domain',
                'server-types',
              ],
            },
            {
              from: ['server-entry'],
              allow: ['server-app'],
            },
            {
              from: ['client-api'],
              allow: ['client-api'],
            },
            {
              from: ['client-hooks'],
              allow: ['client-hooks', 'client-api', 'client-store'],
            },
            {
              from: ['client-components'],
              allow: ['client-components', 'client-hooks'],
            },
            {
              from: ['client-pages'],
              allow: ['client-pages', 'client-components', 'client-hooks'],
            },
          ],
        },
      ],

      // ===== セキュリティ =====
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-possible-timing-attacks': 'warn',

      // ===== Sonar (コードスメル) =====
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-duplicate-string': [
        'warn',
        {
          threshold: 5,
        },
      ],
      'sonarjs/cognitive-complexity': ['warn', 30],

      // ===== コード品質 =====
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'no-unused-vars': 'off', // TypeScript が処理
    },
  },

  // React クライアント側の設定
  {
    files: ['packages/client/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      '@tanstack/query': tanstackQuery,
    },
    settings: {
      react: {
        version: '19.0.0',
      },
    },
    rules: {
      // ===== React =====
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-children-prop': 'error',
      'react/no-danger': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': [
        'error',
        {
          props: 'never',
          children: 'never',
        },
      ],

      // ===== React Hooks =====
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // ===== React Refresh (Vite HMR) =====
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
        },
      ],

      // ===== TanStack Query =====
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'warn',
      '@tanstack/query/stable-query-client': 'error',

      // ===== Accessibility (a11y) =====
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
    },
  },

  // React Hooks 用の命名規約
  {
    files: ['packages/client/src/**/hooks/**/*.{ts,tsx}'],
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          message: 'Hooks層からUI層(pages/components)を参照しないでください。',
          rules: [
            {
              from: ['client-hooks'],
              disallow: ['client-pages', 'client-components'],
            },
          ],
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'function',
          format: ['PascalCase'],
          prefix: ['use'],
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          types: ['function'],
          format: ['PascalCase'],
          prefix: ['use'],
        },
      ],
    },
  },

  // React の Page/Hook/Component から直接 fetch しない
  {
    files: [
      'packages/client/src/pages/**/*.{ts,tsx}',
      'packages/client/src/components/**/*.{ts,tsx}',
      'packages/client/src/hooks/**/*.{ts,tsx}',
    ],
    ignores: [
      'packages/client/src/**/*.test.ts',
      'packages/client/src/**/*.test.tsx',
      'packages/client/src/**/*.spec.ts',
      'packages/client/src/**/*.spec.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            'Pages, components, and hooks must call the shared apiClient instead of fetch directly.',
        },
        {
          selector: "CallExpression[callee.object.name='globalThis'][callee.property.name='fetch']",
          message:
            'Pages, components, and hooks must call the shared apiClient instead of fetch directly.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message: 'Use packages/client/src/api/client.ts instead of axios.',
            },
            {
              name: 'cross-fetch',
              message:
                'Use packages/client/src/api/client.ts instead of performing manual fetches.',
            },
          ],
          patterns: [
            {
              group: ['../api/**', '../hooks/**'],
              message: '共有レイヤーには @client/... エイリアスを使用してください。',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'packages/client/src/pages/**/*.{ts,tsx}',
      'packages/client/src/components/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@client/api/client.js',
              message: 'Pages/Components は Hooks 経由でAPIを呼び出してください。',
            },
          ],
        },
      ],
    },
  },

  // サーバー側（Hono）の設定
  {
    files: ['packages/server/**/*.ts'],
    rules: {
      // サーバー側では console.log を許可（ログ出力として使用）
      'no-console': 'off',
    },
  },
  {
    files: ['packages/server/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**'],
              message: '@server エイリアスでパッケージ内の上位ディレクトリを参照してください。',
            },
            {
              group: ['@server/app/**'],
              message: 'App層の依存はappディレクトリ内でのみ利用してください。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/server/src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**'],
              message: '@server エイリアスでパッケージ内の上位ディレクトリを参照してください。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/server/src/core/domain/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      'no-restricted-globals': ['error', 'fetch', 'Headers', 'Request', 'Response'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@server/adapters/**', '../adapters/**'],
              message: 'Domain層からAdaptersを参照しないでください。',
            },
            {
              group: ['hono', 'drizzle-orm', '@cloudflare/**'],
              message: 'Domain層ではフレームワークやインフラ依存を禁止します。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/server/src/core/usecases/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      'no-restricted-globals': ['error', 'fetch', 'Headers', 'Request', 'Response'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@server/adapters/**', '../adapters/**'],
              message: 'UseCase層からAdaptersを参照しないでください。',
            },
            {
              group: ['hono', 'drizzle-orm', '@cloudflare/**'],
              message: 'UseCase層ではフレームワークやインフラ依存を禁止します。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/ui/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**'],
              message: '@ui エイリアスでパッケージ内の上位ディレクトリを参照してください。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/drizzle/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**'],
              message: '@drizzle エイリアスでパッケージ内の上位ディレクトリを参照してください。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['packages/server/src/adapters/http/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../persistence/**',
                '../../persistence/**',
                '@server/adapters/persistence/**',
              ],
              message:
                'HTTPアダプタ層から直接Persistence層を参照せず、UseCase経由でアクセスしてください。',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='c'][property.name='env']",
          message: 'HTTP層から直接c.envを参照せず、appレイヤが注入する依存を利用してください。',
        },
      ],
    },
  },

  // ESLint 設定ファイルやテストのゆるめ設定
  {
    files: ['eslint.config.js'],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['packages/client/src/tests/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // JavaScript ファイルの設定
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // 無視するファイル
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.wrangler/**',
      '**/drizzle/migrations/**',
      '**/.serena/**',
      '**/pnpm-lock.yaml',
    ],
  }
);
