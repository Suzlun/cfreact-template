/**
 * 詳細な根拠をコード直近へ残すことで無効化を許可するESLintルール。
 *
 * 境界、型安全性、セキュリティのルールは含めず、外部ライブラリの
 * 参照同一性により機械的な解消ができない診断だけを許可する。
 */
const inlineDisableAllowedRules = Object.freeze([
  'project/no-manual-memoization',
  'react-hooks/incompatible-library',
]);

/**
 * 許可リスト以外のルール無効化を拒否するeslint-comments用パターン。
 */
const restrictedDisablePatterns = Object.freeze([
  '*',
  ...inlineDisableAllowedRules.map((ruleName) => `!${ruleName}`),
]);

/**
 * 今後も繰り返し利用するCompiler非互換APIを閉じ込める専用境界。
 *
 * 各APIはallowedFilesだけで直接importでき、Compiler診断もその小さな境界だけで
 * 設定側から無効化する。単発の例外と異なり、利用箇所ごとのinline disableを増やさない。
 */
const recurringCompilerExceptionBoundaries = Object.freeze([
  Object.freeze({
    moduleName: '@tanstack/react-table',
    restrictedImports: Object.freeze(['getCoreRowModel', 'useReactTable']),
    allowedFiles: Object.freeze(['packages/ui/components/data-table-model.ts']),
    disabledRule: 'react-hooks/incompatible-library',
  }),
]);

/**
 * shadcn registry由来で、外部コンポーネント契約の参照同一性を維持する既存ファイル。
 *
 * 新しい手書きUIは対象へ自動追加せず、Compilerへ委譲できない上流契約が確認できた
 * ファイルだけをレビューで登録する。
 */
const upstreamManualMemoizationFiles = Object.freeze([
  'packages/ui/components/carousel.tsx',
  'packages/ui/components/chart.tsx',
  'packages/ui/components/drawer.tsx',
  'packages/ui/components/field.tsx',
  'packages/ui/components/sidebar.tsx',
]);

export {
  inlineDisableAllowedRules,
  recurringCompilerExceptionBoundaries,
  restrictedDisablePatterns,
  upstreamManualMemoizationFiles,
};
