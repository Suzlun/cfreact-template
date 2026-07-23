import { withThemeByClassName } from '@storybook/addon-themes';
import { configure } from 'storybook/test';

import type { Preview } from '@storybook/react-vite';

import '#storybook-styles';

/**
 * 並列 Chromium 実行中も、表示終了 animation 後の Portal 除去を状態条件で待機できる猶予を設定する。
 *
 * Testing Library の既定値 1000ms は CI の負荷時に不足するため、個別 Story へ timeout を複製せず、
 * 全 interaction test が同じ失敗判定基準を使うよう preview 初期化時に一元設定する。
 */
configure({ asyncUtilTimeout: 5_000 });

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
