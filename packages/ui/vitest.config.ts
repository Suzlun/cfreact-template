import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from '#vite-config';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const storybookConfigDirectory = path.join(dirname, '.storybook');

/**
 * 指定テーマで全 Story を Chromium 上のテストへ変換する project を生成する。
 *
 * @param theme Storybook の theme global に固定する表示テーマ。
 * @param viewport Story を検証する画面幅。desktop は Vitest の既定値、mobile は実端末相当の狭幅を使う。
 * @returns Storybook の描画・interaction・accessibility テストを実行する Vitest project。
 */
async function createStorybookTestProject(theme: 'dark' | 'light', viewport: 'desktop' | 'mobile') {
  const storybookPlugins = await storybookTest({
    configDir: storybookConfigDirectory,
    initialGlobals: { theme },
  });

  return {
    extends: true as const,
    plugins: storybookPlugins,
    test: {
      name: viewport === 'desktop' ? `storybook-${theme}` : `storybook-mobile-${theme}`,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({}),
        instances: [{ browser: 'chromium' as const }],
        ...(viewport === 'mobile' ? { viewport: { height: 844, width: 390 } } : {}),
      },
    },
  };
}

const lightStorybookProject = await createStorybookTestProject('light', 'desktop');
const darkStorybookProject = await createStorybookTestProject('dark', 'desktop');
const mobileLightStorybookProject = await createStorybookTestProject('light', 'mobile');
const mobileDarkStorybookProject = await createStorybookTestProject('dark', 'mobile');

/**
 * UI の単体テストと Storybook browser tests を選択実行する統合 Vitest 設定。
 */
const vitestConfig = mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        './vitest.unit.config.ts',
        lightStorybookProject,
        darkStorybookProject,
        mobileLightStorybookProject,
        mobileDarkStorybookProject,
      ],
    },
  })
);

/** UI の単体テストと Storybook browser tests の統合設定を公開する。 */
export default vitestConfig;
