import { enforceLibraryBoundaries } from './rules/enforce-library-boundaries.mjs';
import { noDirectUiPrimitives } from './rules/no-direct-ui-primitives.mjs';
import { noLocalUiComponentShadow } from './rules/no-local-ui-component-shadow.mjs';
import { noManualMemoization } from './rules/no-manual-memoization.mjs';
import { noReactNamespaceImports } from './rules/no-react-namespace-imports.mjs';
import { requireDisableJustification } from './rules/require-disable-justification.mjs';

/**
 * このリポジトリ固有のReact最適化・ESLint例外ポリシーを提供するローカルプラグイン。
 */
const projectEslintPlugin = {
  rules: {
    'enforce-library-boundaries': enforceLibraryBoundaries,
    'no-direct-ui-primitives': noDirectUiPrimitives,
    'no-local-ui-component-shadow': noLocalUiComponentShadow,
    'no-manual-memoization': noManualMemoization,
    'no-react-namespace-imports': noReactNamespaceImports,
    'require-disable-justification': requireDisableJustification,
  },
};

export { projectEslintPlugin };
