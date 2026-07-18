import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';

/**
 * React Compilerを有効化したViteプラグイン列を生成する。
 *
 * frontendとUIテストで同じ変換順序を共有し、Reactの変換後にCompiler用の
 * Babel presetを適用することで、dev・test・build間の設定差異を防ぐ。
 *
 * @returns React Fast RefreshとReact Compilerを有効化するViteプラグイン列。
 */
function createReactCompilerPlugins() {
  return [
    react(),
    babel({
      // preset内のCompiler packageを、この設定packageが所有する依存から一意に解決する。
      cwd: import.meta.dirname,
      presets: [reactCompilerPreset()],
    }),
  ];
}

export { createReactCompilerPlugins };
