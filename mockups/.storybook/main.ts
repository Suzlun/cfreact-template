import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';

const config = {
  stories: ['../*/src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: fileURLToPath(new URL('../../packages/ui/vite.config.ts', import.meta.url)),
      },
    },
  },
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
} satisfies StorybookConfig;

/** アプリごとの統合モックを同じカタログに集める。 */
export default config;
