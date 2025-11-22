import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import boundaries from 'eslint-plugin-boundaries';
import deprecation from 'eslint-plugin-deprecation';
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

const compat = new FlatCompat();

export default tseslint.config(
  // 除外対象
  {
    ignores: ['**/coverage/**', '**/playwright-report/**', '**/test-results/**'],
  },

  // ベース設定
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...compat.extends('plugin:import/typescript'),

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
      deprecation: deprecation,
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
        { type: 'client-types', pattern: 'packages/client/src/types/**/*' },
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
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
          js: 'never',
          jsx: 'never',
        },
      ],
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
              pattern: '@cfreact-template/ui/**',
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
              allow: ['client-hooks', 'client-api', 'client-store', 'client-types'],
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

  // packages 配下は import で拡張子 .js を禁止
  {
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
          js: 'never',
          jsx: 'never',
          mjs: 'never',
          cjs: 'never',
        },
      ],
    },
  },

  // API SDK (生成コード) は厳格ルールを緩和
  {
    files: ['packages/api-sdk/src/generated/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-misused-spread': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
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
    plugins: {
      'hooks-domain': {
        rules: {
          'require-domain-structure': {
            meta: {
              type: 'problem',
              docs: {
                description:
                  'Ensure hooks return both data/actions objects with Data/Actions types',
              },
              schema: [],
            },
            create(context) {
              const hookStack = [];
              const startHook = (node, typeInfo) => {
                hookStack.push({
                  node,
                  hasDomainResult: false,
                  hasType: typeInfo?.hasType ?? false,
                  typeIsValid: typeInfo?.typeIsValid ?? false,
                });
              };
              const endHook = (node) => {
                const info = hookStack.pop();
                if (!info) {
                  return;
                }
                if (!info.hasDomainResult) {
                  context.report({
                    node,
                    message:
                      'ドメイン概念の抽象化が不適切です。hooks は data/actions をまとめて返してください (ドメイン状態と操作の両方)。',
                  });
                }
                if (!info.hasType) {
                  context.report({
                    node,
                    message:
                      'ドメイン概念の抽象化が不適切です。hooks は戻り値に data/actions を含む型注釈（*Data / *Actions）を付けてください。',
                  });
                } else if (!info.typeIsValid) {
                  context.report({
                    node,
                    message:
                      'data の型は *Data、actions の型は *Actions で注釈してください（例: { data: FooData; actions: FooActions }）。',
                  });
                }
              };
              const currentHook = () => hookStack[hookStack.length - 1];

              const checkReturn = (arg) => {
                if (!arg) return false;
                if (arg.type === 'ObjectExpression') {
                  const hasData = arg.properties.some(
                    (prop) =>
                      prop.type === 'Property' &&
                      prop.key.type === 'Identifier' &&
                      prop.key.name === 'data'
                  );
                  const hasActions = arg.properties.some(
                    (prop) =>
                      prop.type === 'Property' &&
                      prop.key.type === 'Identifier' &&
                      prop.key.name === 'actions'
                  );
                  return hasData && hasActions;
                }
                return false;
              };

              const isHookName = (name) => /^use[\dA-Z].*/.test(name ?? '');

              const typeEndsWith = (typeName, suffix) =>
                typeof typeName === 'string' && typeName.endsWith(suffix);

              const getIdentifierName = (typeRef) => {
                if (typeRef.type === 'Identifier') return typeRef.name;
                if (typeRef.type === 'TSQualifiedName' && typeRef.right.type === 'Identifier') {
                  return typeRef.right.name;
                }
                return null;
              };

              const evaluateTypeLiteral = (typeNode) => {
                if (!typeNode || typeNode.type !== 'TSTypeLiteral') {
                  return { hasType: true, typeIsValid: false };
                }
                let dataOk = false;
                let actionsOk = false;
                for (const member of typeNode.members) {
                  if (
                    member.type === 'TSPropertySignature' &&
                    member.key.type === 'Identifier' &&
                    member.typeAnnotation
                  ) {
                    const name = member.key.name;
                    const typeAnn = member.typeAnnotation.typeAnnotation;
                    if (
                      name === 'data' &&
                      typeAnn.type === 'TSTypeReference' &&
                      typeEndsWith(getIdentifierName(typeAnn.typeName) ?? '', 'Data')
                    ) {
                      dataOk = true;
                    }
                    if (
                      name === 'actions' &&
                      typeAnn.type === 'TSTypeReference' &&
                      typeEndsWith(getIdentifierName(typeAnn.typeName) ?? '', 'Actions')
                    ) {
                      actionsOk = true;
                    }
                  }
                }
                return { hasType: true, typeIsValid: dataOk && actionsOk };
              };

              const evaluateTypeAnnotation = (tsAnnotation) => {
                if (!tsAnnotation) return { hasType: false, typeIsValid: false };
                const t =
                  tsAnnotation.type === 'TSTypeAnnotation'
                    ? tsAnnotation.typeAnnotation
                    : tsAnnotation;
                if (!t) return { hasType: false, typeIsValid: false };
                if (t.type === 'TSTypeLiteral') {
                  return evaluateTypeLiteral(t);
                }
                // Other shapes (type aliases etc.) are treated as present but not validated
                return { hasType: true, typeIsValid: false };
              };

              return {
                FunctionDeclaration(node) {
                  if (node.id && isHookName(node.id.name)) {
                    const typeInfo = evaluateTypeAnnotation(node.returnType);
                    startHook(node, typeInfo);
                  }
                },
                'FunctionDeclaration:exit'(node) {
                  if (node.id && isHookName(node.id.name)) {
                    endHook(node);
                  }
                },

                VariableDeclarator(node) {
                  if (
                    node.id.type === 'Identifier' &&
                    isHookName(node.id.name) &&
                    (node.init?.type === 'ArrowFunctionExpression' ||
                      node.init?.type === 'FunctionExpression')
                  ) {
                    const typeInfo =
                      evaluateTypeAnnotation(node.id.typeAnnotation) ||
                      evaluateTypeAnnotation(node.init.returnType);
                    startHook(node, typeInfo);
                    const body = node.init.body;
                    if (body && body.type !== 'BlockStatement' && checkReturn(body)) {
                      const info = currentHook();
                      if (info) info.hasDomainResult = true;
                    }
                  }
                },
                'VariableDeclarator:exit'(node) {
                  if (node.id.type === 'Identifier' && isHookName(node.id.name)) {
                    endHook(node);
                  }
                },

                ReturnStatement(node) {
                  const info = currentHook();
                  if (!info) return;
                  if (checkReturn(node.argument)) {
                    info.hasDomainResult = true;
                  }
                },
              };
            },
          },
        },
      },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name!=/^(use[A-Z0-9].*)/]',
          message:
            'hooks ディレクトリでは値のエクスポートは use で始まるカスタムフックに限定してください。',
        },
        {
          selector:
            "ExportNamedDeclaration[exportKind!='type'] > FunctionDeclaration[id.name!=/^(use[A-Z0-9].*)/]",
          message:
            'hooks ディレクトリでは値のエクスポートは use で始まるカスタムフックに限定してください。',
        },
        {
          selector:
            "ExportNamedDeclaration[exportKind!='type'] > ExportSpecifier[exported.name!=/^(use[A-Z0-9].*)/]",
          message:
            'hooks ディレクトリから再エクスポートできる値は use で始まるカスタムフックのみです。',
        },
        {
          selector: 'ExportDefaultDeclaration > Identifier[name!=/^(use[A-Z0-9].*)/]',
          message:
            'hooks ディレクトリではデフォルトエクスポートも use で始まるカスタムフックにしてください。',
        },
        {
          selector: 'ExportDefaultDeclaration > FunctionDeclaration[id.name!=/^(use[A-Z0-9].*)/]',
          message:
            'hooks ディレクトリではデフォルトエクスポートも use で始まるカスタムフックにしてください。',
        },
        {
          selector:
            'FunctionDeclaration[id.name=/^use/]:not(:has(CallExpression[callee.name=/^(use|useQuery|useMutation|useQueryClient|useState|useEffect|useMemo|useCallback|useRef)/]))',
          message:
            'use* は少なくとも1つは React/TanStack の hook を使って状態・副作用・キャッシュを扱ってください。',
        },
        {
          selector: "ReturnStatement:has(Identifier[name='apiClient'])",
          message:
            'apiClient をそのまま返す/ラップするのは禁止です。hooks 内でドメインロジック・状態をまとめて返してください。',
        },
        {
          selector: "ExportSpecifier[exported.name='apiClient'], Identifier[name='apiClient']",
          message: 'apiClient の再エクスポートを禁止します。',
        },
      ],
      'hooks-domain/require-domain-structure': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**', './**'],
              message: 'hooks は @client/hooks エイリアスを使って参照してください（相対禁止）。',
            },
            {
              group: ['@client/usecases/**', '../usecases/**'],
              message:
                'hooks から usecases 層を参照しないでください。ドメインは専用の hooks で表現してください。',
            },
            {
              group: [
                '@client/components/**',
                '../components/**',
                '@client/pages/**',
                '../pages/**',
              ],
              message: 'hooks では UI 層（pages/components）の import を禁止します。',
            },
          ],
        },
      ],
      'unicorn/filename-case': [
        'error',
        {
          case: 'camelCase',
        },
      ],
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
    files: ['packages/client/src/pages/**/*.{ts,tsx}'],
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
          message: 'Pages must call the shared apiClient instead of fetch directly.',
        },
        {
          selector: "CallExpression[callee.object.name='globalThis'][callee.property.name='fetch']",
          message: 'Pages must call the shared apiClient instead of fetch directly.',
        },
        {
          selector:
            'CallExpression[callee.name=/^(useState|useReducer|useEffect|useLayoutEffect|useInsertionEffect|useMemo|useCallback|useRef|useImperativeHandle|useTransition|useDeferredValue|useId|useSyncExternalStore|useOptimistic|useActionState)$/]',
          message: 'Pages 層では React の組み込み Hooks を直接使わず hooks 層に委譲してください。',
        },
        {
          selector:
            "CallExpression[callee.object.name='React'][callee.property.name=/^(useState|useReducer|useEffect|useLayoutEffect|useInsertionEffect|useMemo|useCallback|useRef|useImperativeHandle|useTransition|useDeferredValue|useId|useSyncExternalStore|useOptimistic|useActionState)$/]",
          message: 'Pages 層では React の組み込み Hooks を直接使わず hooks 層に委譲してください。',
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
            {
              name: 'react',
              importNames: [
                'useState',
                'useReducer',
                'useEffect',
                'useLayoutEffect',
                'useInsertionEffect',
                'useMemo',
                'useCallback',
                'useRef',
                'useImperativeHandle',
                'useTransition',
                'useDeferredValue',
                'useId',
                'useSyncExternalStore',
                'useOptimistic',
                'useActionState',
              ],
              message:
                'Pages 層では React の組み込み Hooks を直接使わず hooks 層に委譲してください。',
            },
          ],
          patterns: [
            {
              group: ['../api/**', '../hooks/**'],
              message: '共有レイヤーには @client/... エイリアスを使用してください。',
            },
            {
              group: ['@client/components/**', '../components/**'],
              message: 'Pages は components/hook を経由してください。',
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
              name: '@client/api/client',
              message: 'Pages/Components は Hooks 経由でAPIを呼び出してください。',
            },
            {
              name: '@client/hooks',
              message: 'hooks は個別フックを指し示すパスで import してください。',
            },
          ],
          patterns: [
            {
              group: ['@client/components/**'],
              message: 'components 同士の循環参照を避け、必要なら hooks 経由にしてください。',
            },
          ],
        },
      ],
    },
  },
  // Pages 直下の TSX ファイルを禁止
  {
    files: ['packages/client/src/pages/*.tsx'],
    ignores: ['packages/client/src/pages/*.test.tsx', 'packages/client/src/pages/*.spec.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            'pages 直下に TSX を直接配置しないでください。サブディレクトリを作成して配置してください。',
        },
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
      'deprecation/deprecation': 'off',
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
      'packages/api-sdk/openapi/**',
      '**/pnpm-lock.yaml',
    ],
  }
);
