/**
 * frontendが直接利用せず、共有UIパッケージ内部へ閉じ込める実装依存。
 *
 * `package`は指定module自体とそのsubpathを禁止し、`prefix`はRadixのように
 * package名自体が接頭辞で分かれる一群を禁止する。代替先はESLint診断へ表示する。
 */
const directUiPrimitiveRestrictions = Object.freeze([
  Object.freeze({
    match: 'package',
    value: '@base-ui/react',
    alternative: '対応する@cfreact-template/uiの公開コンポーネント',
  }),
  Object.freeze({
    match: 'prefix',
    value: '@radix-ui/react-',
    alternative: '対応する@cfreact-template/uiの公開コンポーネント',
  }),
  Object.freeze({
    match: 'package',
    value: 'radix-ui',
    alternative: '対応する@cfreact-template/uiの公開コンポーネント',
  }),
  Object.freeze({
    match: 'package',
    value: '@shadcn/react',
    alternative: '対応する@cfreact-template/uiの公開コンポーネント',
  }),
  Object.freeze({ match: 'exact', value: 'cmdk', alternative: 'Command' }),
  Object.freeze({ match: 'exact', value: 'embla-carousel-react', alternative: 'Carousel' }),
  Object.freeze({ match: 'exact', value: 'input-otp', alternative: 'InputOTP' }),
  Object.freeze({
    match: 'exact',
    value: 'react-day-picker',
    alternative: 'CalendarまたはDatePicker',
  }),
  Object.freeze({
    match: 'exact',
    value: 'react-resizable-panels',
    alternative: 'ResizablePanelGroupなどのResizable公開コンポーネント',
  }),
  Object.freeze({
    match: 'exact',
    value: 'recharts',
    alternative: 'ChartContainerなどのChart公開コンポーネント',
  }),
  Object.freeze({ match: 'exact', value: 'sonner', alternative: 'SonnerToaster' }),
  Object.freeze({ match: 'exact', value: 'dompurify', alternative: 'SafeHTML' }),
  Object.freeze({
    match: 'exact',
    value: 'class-variance-authority',
    alternative: '共有UIコンポーネントまたは@cfreact-template/uiのcn',
  }),
  Object.freeze({
    match: 'exact',
    value: 'clsx',
    alternative: '@cfreact-template/uiのcn',
  }),
  Object.freeze({
    match: 'exact',
    value: 'tailwind-merge',
    alternative: '@cfreact-template/uiのcn',
  }),
]);

export { directUiPrimitiveRestrictions };
