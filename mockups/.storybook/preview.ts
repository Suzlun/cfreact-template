import type { Preview } from '@storybook/react-vite';

const preview = {
  parameters: { layout: 'fullscreen' },
} satisfies Preview;

/** モックの画面幅はStorybookの表示サイズで切り替える。 */
export default preview;
