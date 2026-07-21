import { createReactCompilerPlugins } from '@cfreact-template/build-config/react-compiler';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/**
 * UI パッケージの開発・Storybook・ブラウザテストで共有する Vite 設定。
 *
 * Tailwind CSS と React Compiler を同じ順序で適用し、実行環境ごとの変換差を防ぐ。
 * また、上流ライブラリが公開していない ESM サブパスだけを一箇所で解決する。
 */
const viteConfig = defineConfig({
  plugins: [tailwindcss(), ...createReactCompilerPlugins()],
  resolve: {
    alias: {
      'react-transition-group/TransitionGroupContext':
        'react-transition-group/esm/TransitionGroupContext.js',
    },
  },
});

/** UI の各 Vite 実行環境へ共有設定を公開する。 */
export default viteConfig;
