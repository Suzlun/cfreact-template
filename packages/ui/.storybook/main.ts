import { fileURLToPath, URL } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';

const viteConfigPath = fileURLToPath(new URL('../vite.config.ts', import.meta.url));

/**
 * UI パッケージの Storybook 構成。
 *
 * Story は製品コードから分離した `stories` ディレクトリだけを収集し、公式 addon の
 * version を揃えて Docs・accessibility・theme・browser tests を一貫して提供する。
 */
const config = {
  stories: [
    {
      directory: '../stories',
      files: '**/*.stories.@(ts|tsx)',
      titlePrefix: 'UI',
    },
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath,
      },
    },
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  docs: {
    defaultName: 'Docs',
  },
} satisfies StorybookConfig;

/** UI パッケージで使用する Storybook 構成を公開する。 */
export default config;
