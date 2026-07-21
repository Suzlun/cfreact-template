import { withThemeByClassName } from '@storybook/addon-themes';

import type { Preview } from '@storybook/react-vite';

import '#storybook-styles';

/**
 * 全 Story に適用する描画・documentation・accessibility 設定。
 *
 * Light/Dark は製品 CSS と同じ `.dark` class で切り替え、全 Story を Autodocs と
 * browser tests の対象にする。accessibility 違反は CI を失敗させる。
 */
const preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
  tags: ['autodocs', 'test'],
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
} satisfies Preview;

/** 全 Story に適用する preview annotation を公開する。 */
export default preview;
