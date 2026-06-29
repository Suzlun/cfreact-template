import { fileURLToPath } from 'node:url';

/**
 * UIパッケージがTailwindへ公開するcontent globです。
 *
 * frontendパッケージが `../ui/**` のようなsource直参照を持つと、workspace packageの境界を迂回します。
 * そのため、UIパッケージ自身がTailwindの走査対象を公開し、利用側はpackage exportだけを参照します。
 *
 * @returns Tailwind CSS がclass抽出に使う、UIパッケージ内の絶対パスglob配列です。
 * @example
 * ```ts
 * import { uiTailwindContent } from '@cfreact-template/ui/tailwind-content';
 * ```
 */
export const uiTailwindContent: string[] = [
  fileURLToPath(new URL('./SafeHTML.tsx', import.meta.url)),
  fileURLToPath(new URL('./components/**/*.{ts,tsx}', import.meta.url)),
  fileURLToPath(new URL('./hooks/**/*.{ts,tsx}', import.meta.url)),
  fileURLToPath(new URL('./lib/**/*.{ts,tsx}', import.meta.url)),
];
