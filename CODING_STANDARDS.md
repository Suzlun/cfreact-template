# コーディング規則

本書は lint、CI、git hooks が機械的に強制するルールだけを、人が一目で分かる形にまとめたものです。設定ファイルに書かれていないルールは、このリポジトリでは強制されません。

## 1. 本書の位置付け

- 正は設定と自動実行
- 本書は設定から抜き出した要約
- 乖離を見つけたら `opencode run --command rules.update-coding-standard` を実行して更新する

## 2. 目的

- 変更しても壊れにくい依存方向を強制する
- 生成物の改変や契約のズレを自動で検出する
- 初心者でも失敗しない最小ルールを明文化する

## 3. プロジェクト構造

この構造は `eslint-plugin-boundaries` の要素定義と依存方向検査の入力として使われます。

現在のリソースは `users`、`hello`、`health` です。`users` はハンドラー、サービス、リポジトリ、`Drizzle` スキーマを持ち、`hello` と `health` はサービスやリポジトリを必要としないハンドラーまでの構成です。

### サーバー要素

- `backend-entry`: `packages/backend/src/entry/index.ts`
- `backend-app`: `packages/backend/src/app/**/*`
- `backend-generated-api`: `packages/backend/src/generated/api/openapi.ts`
- `backend-generated-resource`: `packages/backend/src/generated/api/<module>/**/*`
- `backend-platform-http`: `packages/backend/src/platform/http/**/*`
- `backend-platform-database`: `packages/backend/src/platform/database/**/*`
- `backend-platform-email`: `packages/backend/src/platform/email/**/*`
- `backend-platform-observability`: `packages/backend/src/platform/observability/**/*`
- `backend-module-handler`: `packages/backend/src/modules/<module>/handlers/**/*`
- `backend-module-test`: `packages/backend/src/modules/<module>/*.test.ts`
- `backend-module-service`: `packages/backend/src/modules/<module>/*.service.ts`
- `backend-module-repository`: `packages/backend/src/modules/<module>/*.repository.ts`
- `backend-module-schema`: `packages/backend/src/modules/<module>/*.schema.ts`
- `backend-module-domain`: `packages/backend/src/modules/<module>/domain/**/*`
- `backend-module-entry`: `packages/backend/src/modules/<module>/index.ts`
- `backend-module-support`: `packages/backend/src/modules/<module>/*.ts`（上記を除く）
- `backend-types`: `packages/backend/src/types/**/*`

### クライアント・共通要素

- `frontend-api`: `packages/frontend/src/api/**/*`
- `frontend-domain`: `packages/frontend/src/domain/**/*`
- `frontend-app`: `packages/frontend/src/app/**/*`
- `ui`: `packages/ui/index.ts`、`packages/ui/SafeHTML.tsx`、`packages/ui/components/**/*`、`packages/ui/hooks/**/*`、`packages/ui/lib/**/*`、`packages/ui/styles/**/*`、`packages/ui/tests/**/*`
- `ui-storybook`: `packages/ui/stories/**/*`

要素に属さない TS/TSX ファイルは `boundaries/no-unknown-files` で失敗します。対象は `packages/backend/src/**/*.{ts,tsx}`、`packages/frontend/src/**/*.{ts,tsx}`、および上記の `ui` と `ui-storybook` に対応する TS/TSX パスです。

## 4. 依存方向

許可されていない要素へのインポートは `pnpm lint` → `eslint .` → `rules['boundaries/element-types']` → `eslint.config.js` で失敗します。許可方向は次のとおりです。

- `backend-entry` → `backend-app`
- `backend-app` → `backend-app | backend-generated-api | backend-generated-resource | backend-module-entry | backend-module-repository | backend-platform-http | backend-platform-database | backend-platform-email | backend-platform-observability | backend-types`
- `backend-generated-resource` → `backend-generated-api`、同じリソースの `backend-generated-resource | backend-module-handler`
- `backend-platform-http` → `backend-platform-http | backend-types`
- `backend-platform-database` → `backend-platform-database | backend-types`
- `backend-platform-email` → `backend-platform-email | backend-types`
- `backend-platform-observability` → `backend-platform-observability | backend-types`
- `backend-module-handler` → `backend-generated-api | backend-platform-http | backend-types`、同じリソースの `backend-generated-resource | backend-module-entry | backend-module-service | backend-module-support`
- `backend-module-test` → `backend-types`、同じリソースの`backend-module-domain | backend-module-repository | backend-module-service | backend-module-support`
- `backend-module-service` → `backend-types`、同じリソースの `backend-module-repository | backend-module-domain | backend-module-support`、各リソースの `backend-module-entry`
- `backend-module-repository` → `backend-platform-database | backend-types`、同じリソースの `backend-module-schema | backend-module-support`
- `backend-module-schema` → 同じリソースの `backend-module-schema`
- `backend-module-domain` → `backend-types`、同じリソースの `backend-module-domain | backend-module-support`
- `backend-module-entry` → 同じリソースの `backend-module-service | backend-module-domain | backend-module-support`
- `backend-module-support` → `backend-generated-api | backend-types`、同じリソースの `backend-generated-resource | backend-module-support`
- `backend-types` → `backend-types`
- `frontend-api` → `frontend-api`
- `frontend-domain` → `frontend-domain | frontend-api`
- `frontend-app` → `frontend-app | frontend-domain | ui`
- `ui` → `ui`
- `ui-storybook` → `ui-storybook | ui`

リソース名は `eslint-plugin-boundaries` の `capture` で取得します。同じ要素でも `captured.module` が異なるリソースは許可されません。要素外ファイルへの依存は `boundaries/no-unknown`、親ディレクトリへの逃避はバックエンド用の `no-restricted-imports` でも失敗します。

## 5. import / export

ルール

- import の拡張子を付けない
  - 強制: `pnpm lint` → `eslint .` → `rules['import/extensions']` → `eslint.config.js`
  - NG例
    ```ts
    import { x } from './x.ts';
    ```
  - OK例
    ```ts
    import { x } from './x';
    ```

- `packages/**/*.{ts,tsx}` から `.js/.mjs/.cjs` を import しない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/**/*.{ts,tsx}']`
  - NG例
    ```ts
    import { foo } from './foo.js';
    ```
  - OK例
    ```ts
    import { foo } from './foo';
    ```

- import 順序は `builtin → external → internal → parent/sibling/index → type` にし、グループ間に空行を入れる
  - 強制: `pnpm lint` → `eslint .` → `rules['import/order']` → `eslint.config.js`
  - NG例
    ```ts
    import { z } from 'zod';
    import fs from 'node:fs';
    ```
  - OK例

    ```ts
    import fs from 'node:fs';

    import { z } from 'zod';
    ```

- `packages/**/index.ts` は re-export のみで、実装と default export を禁止
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` → `eslint.config.js` の `files: ['packages/**/index.ts']`
  - NG例
    ```ts
    // packages/foo/index.ts
    export default function f() {
      return 1;
    }
    ```
  - OK例
    ```ts
    // packages/foo/index.ts
    export * from './something';
    export { something } from './something';
    ```

- `packages/**/src/**/*.{ts,tsx}` では、モジュール内部以外の実装を相対インポートで直接参照しない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-imports']` と `rules['boundaries/element-types']` → `eslint.config.js`
  - NG例
    ```ts
    import { parse2 } from './utils/parse2';
    ```
  - OK例
    ```ts
    import { something } from './utils';
    ```

- `packages/backend/src/platform`、`packages/backend/src/types`、`packages/ui` は上位ディレクトリ参照の相対インポートを禁止し、エイリアスを使う
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-imports']` → `eslint.config.js`
  - 対象
    - `packages/backend/src/platform/**/*.{ts,tsx}`
    - `packages/backend/src/types/**/*.{ts,tsx}`
    - `packages/ui/**/*.{ts,tsx}`
  - NG例
    ```ts
    import { x } from '../platform/x';
    ```
  - OK例
    ```ts
    import { x } from '@cfreact-template/backend/platform/x';
    ```

- ESLint の inline 無効化は、許可リストにある単発例外を `eslint-disable-next-line` で1ルールだけ無効化する場合に限定する
  - 強制: `pnpm lint` → `eslint .` → `eslint-comments/*`, `project/require-disable-justification` → `eslint.config.js`, `scripts/eslint/**`
  - 必須項目
    - `理由:`
    - `検討した代替案:`
    - `不採用理由:`
    - `再評価条件:`
  - 制約
    - 各項目は空白を除いて15文字以上にする
    - `TODO`, `TBD`, `FIXME`, `不明`, `仮対応`, `一時対応`などの未確定表現を書かない
    - `eslint-disable`, `eslint-disable-line`, 複数ルールの同時無効化を使わない
    - 境界、型安全性、Hooksの正しさ、セキュリティのルールは無効化しない
  - NG例
    ```ts
    // eslint-disable-next-line no-restricted-imports -- 必要だから
    import { apiClient } from '@cfreact-template/frontend/api';
    ```
  - OK例
    ```ts
    /* eslint-disable-next-line project/no-manual-memoization --
     * 理由: 外部ライブラリの解除APIが登録時と同一のcallback参照を要求するため。
     * 検討した代替案: callbackをEffect内部で生成し、登録と解除を同じEffectへ閉じ込める案を検討した。
     * 不採用理由: 外部ライブラリがEffect外の公開APIにも同じcallback参照を要求するため適用できない。
     * 再評価条件: 外部ライブラリが購読解除関数を返すAPIへ変更された更新時に例外を削除する。
     */
    const callback = useCallback(handleChange, [handleChange]);
    ```

## 6. 公開 API のドキュメント

ルール

- `packages/**/src/**/*.{ts,tsx}` の export には直前に TSDoc を付ける
  - 強制: `pnpm lint` → `eslint .` → `rules['export-tsdoc/require-export-tsdoc']` → `eslint.config.js`
  - 対象外
    - `packages/backend/src/generated/**/*.{ts,tsx}`
    - `packages/frontend/src/api/generated/**/*.{ts,tsx}`
    - `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`
  - NG例
    ```ts
    export function hello() {
      return 'hi';
    }
    ```
  - OK例
    ```ts
    /**
     * 挨拶文を返す
     */
    export function hello() {
      return 'hi';
    }
    ```

ルール

- 公開 API の契約、完全生成ファイル、スマートハンドラーの生成前置きを手で編集しない
  - 強制: `pnpm check:codegen` → `scripts.check:codegen` → `package.json`
  - 強制: pre-commit hook → `pnpm check:codegen` → `.husky/pre-commit`
  - 生成物
    - `packages/typespec/openapi/openapi.json`
    - `packages/backend/src/generated/api/openapi.ts`
    - `packages/backend/src/generated/api/<resource>/**`
    - `packages/backend/src/modules/*/handlers/**`（`Orval` 前置きは生成器所有、関数本体は開発者所有）
    - `packages/frontend/src/api/generated/client.ts`
  - 生成物は Git 管理対象
    - 強制: `pnpm check:codegen` → `scripts/codegen/verify-generated-artifacts.mjs` → `git ls-files --cached -z`
    - 現在の OpenAPI 操作、生成物ルート、実在する各モジュールのハンドラーディレクトリから対象ファイルを動的に列挙する
    - ステージ済みの新規ファイルは受理し、未追跡の生成物は失敗させる
  - 生成前に入出力ルートの実体経路とシンボリックリンクを検査する
    - 強制: 各パッケージの生成スクリプト → `scripts/codegen/verify-codegen-roots.mjs`
    - OpenAPI、バックエンド生成物、モジュール、フロントエンド生成物の各ルートを実体経路でリポジトリ内へ限定し、配下のシンボリックリンクを拒否する
  - ハンドラー一覧は OpenAPI のリソース `tag` と `operationId` に一致させる
    - 強制: `pnpm check:codegen` → `scripts/codegen/verify-backend-handlers.mjs`
    - 不足したハンドラー、余分なハンドラー、契約から消えた生成リソースのいずれでも失敗する
  - `Orval` が生成したハンドラーのコンテキスト参照を型専用インポートへ正規化する
    - 強制: `pnpm gen:api-sdk` → `packages/backend/package.json#scripts.gen:api` → `scripts/codegen/normalize-backend-handler-imports.mjs`
    - 期待するコンテキスト参照が一つだけでない場合は失敗し、正規化後に `Prettier` を実行する
  - 再生成
    - `pnpm gen:api-sdk`
  - 入力と出力の定義
    - `TypeSpec` の入口: `packages/typespec/main.tsp`
    - OpenAPI の出力: `packages/typespec/tspconfig.yaml` の `options['@typespec/openapi3'].output-file` と `options['@typespec/openapi3'].emitter-output-dir`
    - バックエンド型の出力: `packages/backend/package.json` の `gen:types`
    - バックエンドのリソースとハンドラーの出力: `packages/backend/orval.config.ts`
    - フロントエンド SDK の出力: `packages/frontend/orval.config.ts` の `input` と `output.target`
  - NG例
    ```diff
    -  "title": "cfreact-template API"
    +  "title": "my manual edit"
    ```
  - OK例
    ```sh
    pnpm gen:api-sdk
    ```

## 7. TypeScript

ルール

- `any` を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/no-explicit-any']` → `eslint.config.js`
  - NG例
    ```ts
    const x: any = 1;
    ```
  - OK例
    ```ts
    const x: number = 1;
    ```

- unsafe な代入と呼び出しとメンバーアクセスをしない
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/no-unsafe-assignment']` → `eslint.config.js`
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/no-unsafe-call']` → `eslint.config.js`
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/no-unsafe-member-access']` → `eslint.config.js`
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/no-unsafe-return']` → `eslint.config.js`
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/no-unsafe-argument']` → `eslint.config.js`
  - NG例
    ```ts
    const obj: unknown = JSON.parse('{}');
    obj.x.y();
    ```
  - OK例
    ```ts
    const obj: unknown = JSON.parse('{}');
    if (typeof obj === 'object' && obj && 'x' in obj) {
      // ここで絞り込む
    }
    ```

- 条件式で文字列や数値の truthy 判定をしない
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/strict-boolean-expressions']` → `eslint.config.js`
  - NG例
    ```ts
    if (userId) {
      doSomething();
    }
    ```
  - OK例
    ```ts
    if (userId !== '') {
      doSomething();
    }
    ```

- `Promise` を握りつぶさない
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/no-floating-promises']` → `eslint.config.js`
  - NG例
    ```ts
    doAsync();
    ```
  - OK例
    ```ts
    await doAsync();
    ```

- `import type` を使う
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/consistent-type-imports']` → `eslint.config.js`
  - NG例
    ```ts
    import { User } from './types';
    ```
  - OK例
    ```ts
    import type { User } from './types';
    ```

- 未使用の変数と引数を残さない
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/no-unused-vars']` → `eslint.config.js`
  - 例外
    - `_` で始まる名前は未使用を許可
  - NG例
    ```ts
    function f(x: number) {
      return 1;
    }
    ```
  - OK例
    ```ts
    function f(_x: number) {
      return 1;
    }
    ```

- `debugger` を残さない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-debugger']` → `eslint.config.js`
  - NG例
    ```ts
    debugger;
    ```
  - OK例
    ```ts
    // 削除する
    ```

- `alert` を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-alert']` → `eslint.config.js`
  - NG例
    ```ts
    alert('x');
    ```
  - OK例
    ```ts
    // alert を削除し、UI で表現する
    ```

- `var` を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-var']` → `eslint.config.js`
  - NG例
    ```ts
    var x = 1;
    ```
  - OK例
    ```ts
    const x = 1;
    ```

- `Array.prototype.forEach` を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['unicorn/no-array-for-each']` → `eslint.config.js`
  - NG例
    ```ts
    items.forEach((x) => console.log(x));
    ```
  - OK例
    ```ts
    for (const x of items) {
      console.log(x);
    }
    ```

- `eval` と `new Function` を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-eval']`, `rules['no-new-func']` → `eslint.config.js`
  - NG例
    ```ts
    const f = new Function('return 1');
    ```
  - OK例
    ```ts
    const f = () => 1;
    ```

## 8. クライアント実装規則

ルール

- App 層から API パッケージを直接 import しない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/frontend/src/app/**/*.{ts,tsx}']`
  - NG例
    ```ts
    import { apiClient } from '@cfreact-template/frontend/api';
    ```
  - OK例
    ```ts
    import { useUsers } from '@cfreact-template/frontend/domain/hooks/users';
    ```

- Pages と Components で `@cfreact-template/frontend/domain` をまとめ import しない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/frontend/src/app/pages/**/*.{ts,tsx}', 'packages/frontend/src/app/components/**/*.{ts,tsx}']`
  - NG例
    ```ts
    import { useUsers } from '@cfreact-template/frontend/domain';
    ```
  - OK例
    ```ts
    import { useUsers } from '@cfreact-template/frontend/domain/hooks/users';
    ```

- Pages と Components と Hooks で `fetch` を直接呼ばない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` → `eslint.config.js` の `files: ['packages/frontend/src/app/**/*.{ts,tsx}', 'packages/frontend/src/domain/**/*.{ts,tsx}']`
  - NG例
    ```ts
    const res = await fetch('/api');
    ```
  - OK例
    ```ts
    // packages/frontend/src/domain/hooks/users/useUsers.ts
    const res = await apiClient.users.listUsers();
    ```

- `axios` と `cross-fetch` を import しない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/frontend/src/app/**/*.{ts,tsx}', 'packages/frontend/src/domain/**/*.{ts,tsx}']`
  - NG例
    ```ts
    import axios from 'axios';
    ```
  - OK例
    ```ts
    // packages/frontend/src/domain/hooks/users/useUsers.ts
    import { apiClient } from '@cfreact-template/frontend/api';
    ```

- frontend から共有 UI の primitive、sanitizer、style 実装を直接 import / re-export しない
  - 強制: `pnpm lint` → `eslint .` → `project/no-direct-ui-primitives` → `scripts/ui/ui-reuse-policy.mjs`
  - 対象
    - `@base-ui/react` と subpath
    - `@radix-ui/react-*`, `radix-ui`, `@shadcn/react` と subpath
    - `cmdk`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `recharts`, `sonner`
    - `dompurify`
    - `class-variance-authority`, `clsx`, `tailwind-merge`
  - 補足
    - `react-hook-form` は `Form` の利用契約、`@tanstack/react-table` の型と列定義は `DataTable` の利用契約なので一律禁止しない
    - `@tanstack/react-table` の runtime model API は `project/enforce-library-boundaries` で専用境界へ限定する
  - NG例
    ```ts
    import { Button } from '@base-ui/react/button';
    import { cva } from 'class-variance-authority';
    ```
  - OK例
    ```ts
    import { Button, cn } from '@cfreact-template/ui';
    ```

- app で公開 UI と同名の値を宣言したり、共有 UI を app から再 export したりしない
  - 強制: `pnpm lint` → `eslint .` → `project/no-local-ui-component-shadow` → `scripts/ui/public-component-catalog.mjs`
  - 公開 UI 名は `packages/ui` の TypeScript runtime export と `packages/ui/index.ts` から解決する
  - Storybook は公開 UI ファイルごとの実行可能 catalog として対応関係を検証する
  - NG例
    ```tsx
    function Button() {
      return <button type="button">Save</button>;
    }
    ```
  - NG例
    ```ts
    export { Button } from '@cfreact-template/ui';
    ```
  - OK例

    ```tsx
    import { Button } from '@cfreact-template/ui';

    function SaveAction() {
      return <Button>Save</Button>;
    }
    ```

- `pages/` 直下に TSX を置かない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` → `eslint.config.js` の `files: ['packages/frontend/src/app/pages/*.tsx']`
  - NG例
    - `packages/frontend/src/app/pages/Home.tsx`
  - OK例
    - `packages/frontend/src/app/pages/home/Home.tsx`

- Pages では `useState` 以外の React 組み込み Hooks を直接使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` と `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/frontend/src/app/pages/**/*.{ts,tsx}']`
  - NG例

    ```tsx
    import { useEffect } from 'react';

    export function Page() {
      useEffect(() => {}, []);
      return null;
    }
    ```

  - OK例

    ```tsx
    import { useUsers } from '@cfreact-template/frontend/domain/hooks/users';

    export function Page() {
      const { data } = useUsers();
      return <div>{data.status}</div>;
    }
    ```

- Pages では `useMemo` と `useCallback` を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` と `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/frontend/src/app/pages/**/*.{ts,tsx}']`
  - NG例

    ```tsx
    import { useMemo } from 'react';

    const x = useMemo(() => 1, []);
    ```

  - OK例
    ```tsx
    // 最適化が必要なら components または hooks へ移す
    ```

- Components では `useState` を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` と `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/frontend/src/app/components/**/*.{ts,tsx}']`
  - NG例
    ```tsx
    import { useState } from 'react';
    ```
  - OK例
    ```tsx
    import { useUsers } from '@cfreact-template/frontend/domain/hooks/users';
    ```

- Components では React 組み込み Hooks を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` と `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/frontend/src/app/components/**/*.{ts,tsx}']`
  - NG例
    ```tsx
    import { useMemo } from 'react';
    ```
  - OK例
    ```tsx
    const visibleUsers = users.filter((user) => user.isVisible);
    ```

- React Hooks のルールを守る
  - 強制: `pnpm lint` → `eslint .` → `eslint-plugin-react-hooks` の `recommended-latest` → `eslint.config.js`
  - NG例

    ```tsx
    import { useEffect } from 'react';

    // packages/ui/components/Comp.tsx

    export function Comp({ id }: { id: string }) {
      if (id !== '') {
        useEffect(() => {}, []);
      }
      return null;
    }
    ```

- frontend と UI の通常のメモ化は React Compiler に委譲する
  - 強制: `packages/frontend/vite.config.ts`, `packages/frontend/vitest.app.config.ts`, `packages/ui/vitest.config.ts` → `@cfreact-template/build-config/react-compiler`
  - 強制: domain と手書き UI の手動メモ化 → `project/no-manual-memoization` → `scripts/eslint/rules/no-manual-memoization.mjs`
  - 補足
    - domain Hook の `{ data, actions }` 契約は維持し、参照同一性を正しさの契約にしない
    - app pages は `useState` だけを許可し、app components はReact組み込みHookを使わない
    - domain と UI の Effect は外部システムとの同期に限定する
    - shadcn registry由来で既存の手動メモ化を維持するファイルは `scripts/eslint/disable-policy.mjs` の `upstreamManualMemoizationFiles` だけを対象外にする
  - NG例
    ```ts
    const actions = useMemo(() => ({ reload }), [reload]);
    ```
  - OK例
    ```ts
    const actions = { reload };
    ```

- 頻出する Compiler 非互換 API は専用境界へ集約する
  - 強制: `project/enforce-library-boundaries` → `scripts/eslint/disable-policy.mjs`, `scripts/eslint/rules/enforce-library-boundaries.mjs`
  - 現在の専用境界
    - `@tanstack/react-table` の `useReactTable`, `getCoreRowModel` → `packages/ui/components/data-table-model.ts`
  - NG例
    ```ts
    // data-table-model.ts 以外
    import { useReactTable } from '@tanstack/react-table';
    ```
  - OK例

    ```ts
    import { DataTable } from '@cfreact-template/ui/components/data-table';
    ```

  - OK例

    ```tsx
    import { useEffect } from 'react';

    // packages/ui/components/Comp.tsx

    export function Comp({ id }: { id: string }) {
      useEffect(() => {
        void id;
      }, [id]);
      return null;
    }
    ```

- 配列を JSX で描画するときは `key` を付ける
  - 強制: `pnpm lint` → `eslint .` → `rules['react/jsx-key']` → `eslint.config.js`
  - NG例
    ```tsx
    {
      items.map((x) => <li>{x.name}</li>);
    }
    ```
  - OK例
    ```tsx
    {
      items.map((x) => <li key={x.id}>{x.name}</li>);
    }
    ```

- 画像には代替テキストを付ける
  - 強制: `pnpm lint` → `eslint .` → `rules['jsx-a11y/alt-text']` → `eslint.config.js`
  - NG例
    ```tsx
    <img src="/logo.png" />
    ```
  - OK例
    ```tsx
    <img src="/logo.png" alt="logo" />
    ```

- `dangerouslySetInnerHTML` を使わない
  - 強制: `pnpm lint` → `eslint .` → `rules['react/no-danger']` → `eslint.config.js`
  - NG例
    ```tsx
    <div dangerouslySetInnerHTML={{ __html: html }} />
    ```
  - OK例
    ```tsx
    <div>{text}</div>
    ```

ルール

- hooks ディレクトリで export できる値は `useXxx` だけ
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` → `eslint.config.js` の `files: ['packages/frontend/src/domain/hooks/**/*.{ts,tsx}']`
  - NG例
    ```ts
    export const foo = 1;
    ```
  - OK例
    ```ts
    export function useFoo() {
      return { data: { status: 'ok' }, actions: {} };
    }
    ```

- hooks は `data` と `actions` をまとめて返し、戻り値に型注釈を付ける
  - 強制: `pnpm lint` → `eslint .` → `rules['hooks-domain/require-domain-structure']` → `eslint.config.js`
  - NG例
    ```ts
    export function useFoo() {
      return { data: { status: 'ok' } };
    }
    ```
  - OK例

    ```ts
    type FooData = { status: 'ok' };
    type FooActions = {};

    export function useFoo(): { data: FooData; actions: FooActions } {
      return { data: { status: 'ok' }, actions: {} };
    }
    ```

- hooks から `apiClient` を返す、再エクスポートする
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` → `eslint.config.js` の `files: ['packages/frontend/src/domain/hooks/**/*.{ts,tsx}']`
  - NG例
    ```ts
    export { apiClient } from '@cfreact-template/frontend/api';
    ```
  - OK例
    ```ts
    export function useUsers() {
      return { data: { users: [] }, actions: { reload: () => {} } };
    }
    ```

- hooks の型 import は `types` 経由に限定する
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-syntax']` → `eslint.config.js` の `files: ['packages/frontend/src/domain/hooks/**/*.{ts,tsx}']`
  - NG例
    ```ts
    import type { User } from '../models/user';
    ```
  - OK例
    ```ts
    import type { User } from 'types';
    ```

- hooks では UI 層の import をしない
  - 強制: `pnpm lint` → `eslint .` → `rules['no-restricted-imports']` → `eslint.config.js` の `files: ['packages/frontend/src/domain/hooks/**/*.{ts,tsx}']`
  - NG例
    ```ts
    import { Button } from '@cfreact-template/frontend/app/components/Button';
    ```
  - OK例
    ```ts
    // UI は hooks の戻り値を使う
    ```

- hooks のファイル名は camelCase にする
  - 強制: `pnpm lint` → `eslint .` → `rules['unicorn/filename-case']` → `eslint.config.js`
  - NG例
    - `use_users.ts`
  - OK例
    - `useUsers.ts`

- hooks の関数名は `use` で始まり、`useXxx` の形にする
  - 強制: `pnpm lint` → `eslint .` → `rules['@typescript-eslint/naming-convention']` → `eslint.config.js`
  - NG例
    ```ts
    export function useusers() {
      return { data: {}, actions: {} };
    }
    ```
  - OK例
    ```ts
    export function useUsers() {
      return { data: {}, actions: {} };
    }
    ```

## 9. サーバー実装規則

この節は、現在の `packages/backend/src` に対して `eslint.config.js` が実際に適用するリソース中心の構造を要約します。

### 9.1 ソース要素

| 要素                             | 対象                                                       | 所有する責務                                                 |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| `backend-entry`                  | `packages/backend/src/entry/index.ts`                      | `Cloudflare Workers` の公開入口。`app` だけを参照する        |
| `backend-app`                    | `packages/backend/src/app/**/*`                            | 構成起点。生成リソース、モジュール、基盤、共有型を組み立てる |
| `backend-generated-api`          | `packages/backend/src/generated/api/openapi.ts`            | `openapi-typescript` が生成する共有 OpenAPI 型               |
| `backend-generated-resource`     | `packages/backend/src/generated/api/<module>/**/*`         | `Orval` が生成するリソース別 `Hono` 経路、検証処理、スキーマ |
| `backend-platform-http`          | `packages/backend/src/platform/http/**/*`                  | HTTP 応答検証などの基盤処理                                  |
| `backend-platform-database`      | `packages/backend/src/platform/database/**/*`              | `D1` と `Drizzle` の接続処理                                 |
| `backend-platform-email`         | `packages/backend/src/platform/email/**/*`                 | `Cloudflare Email Workers` の送信処理                        |
| `backend-platform-observability` | `packages/backend/src/platform/observability/**/*`         | 内部失敗の記録                                               |
| `backend-module-handler`         | `packages/backend/src/modules/<module>/handlers/**/*`      | 契約済み入力とサービス結果を HTTP 応答へ変換する             |
| `backend-module-test`            | `packages/backend/src/modules/<module>/*.test.ts`          | 同じリソースの純粋で決定的な業務規則を検証する               |
| `backend-module-service`         | `packages/backend/src/modules/<module>/*.service.ts`       | リソースの業務処理と副作用を調整する                         |
| `backend-module-repository`      | `packages/backend/src/modules/<module>/*.repository.ts`    | リソース所有データを永続化する                               |
| `backend-module-schema`          | `packages/backend/src/modules/<module>/*.schema.ts`        | リソース所有の `Drizzle` スキーマ                            |
| `backend-module-domain`          | `packages/backend/src/modules/<module>/domain/**/*`        | リソース固有の純粋なドメイン規則                             |
| `backend-module-entry`           | `packages/backend/src/modules/<module>/index.ts`           | リソースの唯一の公開入口                                     |
| `backend-module-support`         | `packages/backend/src/modules/<module>/*.ts`（上記を除く） | リソース内で共有する補助型、応答、補助処理                   |
| `backend-types`                  | `packages/backend/src/types/**/*`                          | 複数リソースで共有する型                                     |

要素外のバックエンド `TypeScript` ファイルは `boundaries/no-unknown-files`、要素外へのインポートは `boundaries/no-unknown` と `boundaries/element-types` で失敗します。

### 9.2 依存方向

- `backend-entry` → `backend-app`
- `backend-app` → `backend-app | backend-generated-api | backend-generated-resource | backend-module-entry | backend-module-repository | backend-platform-http | backend-platform-database | backend-platform-email | backend-platform-observability | backend-types`
- `backend-generated-resource` → `backend-generated-api`、同じリソースの `backend-generated-resource | backend-module-handler`
- `backend-platform-http` → `backend-platform-http | backend-types`
- `backend-platform-database` → `backend-platform-database | backend-types`
- `backend-platform-email` → `backend-platform-email | backend-types`
- `backend-platform-observability` → `backend-platform-observability | backend-types`
- `backend-module-handler` → `backend-generated-api | backend-platform-http | backend-types`、同じリソースの `backend-generated-resource | backend-module-entry | backend-module-service | backend-module-support`
- `backend-module-test` → `backend-types`、同じリソースの`backend-module-domain | backend-module-repository | backend-module-service | backend-module-support`
- `backend-module-service` → `backend-types`、同じリソースの `backend-module-repository | backend-module-domain | backend-module-support`、各リソースの `backend-module-entry`
- `backend-module-repository` → `backend-platform-database | backend-types`、同じリソースの `backend-module-schema | backend-module-support`
- `backend-module-schema` → 同じリソースの `backend-module-schema`
- `backend-module-domain` → `backend-types`、同じリソースの `backend-module-domain | backend-module-support`
- `backend-module-entry` → 同じリソースの `backend-module-service | backend-module-domain | backend-module-support`
- `backend-module-support` → `backend-generated-api | backend-types`、同じリソースの `backend-generated-resource | backend-module-support`
- `backend-types` → `backend-types`

`eslint-plugin-boundaries` の `capture` で `<module>` を取得し、`captured.module` が同じ要素だけを同一リソースとして許可します。そのため、同じファイル名や同じ要素であっても、別リソースの内部実装へは依存できません。サービスが別リソースを利用する場合だけ、`packages/backend/src/modules/<module>/index.ts` の公開入口を指定します。

### 9.3 外部パッケージ

`pnpm lint` → `eslint .` → `rules['boundaries/external']` → `eslint.config.js` は、バックエンド要素から外部パッケージへの依存を既定で拒否し、次だけを許可します。

- `backend-app` → `hono`
- `backend-generated-resource` → `@hono/zod-validator | hono | zod`
- `backend-module-handler` → `hono`
- `backend-module-test` → `vitest`
- `backend-module-service` → `ulid`
- `backend-module-repository` → `drizzle-orm`
- `backend-module-schema` → `drizzle-orm`
- `backend-platform-http` → `hono`
- `backend-platform-database` → `drizzle-orm`
- `backend-platform-email` → `cloudflare:email`
- `backend-types` → `@cloudflare/workers-types`

`backend-entry`、`backend-generated-api`、`backend-platform-observability`、`backend-module-domain`、`backend-module-entry`、`backend-module-support` には外部パッケージの許可がありません。`backend-module-test`の`vitest`許可は純粋試験だけに適用し、製品要素の外部依存を広げません。

### 9.4 HTTP 実行環境への直接到達

- ハンドラーとサービスは、未修飾または `globalThis` 経由の `fetch`、`Request`、`Response`、`Headers` を使えません。
  - 強制: `no-restricted-globals` と `no-restricted-syntax` → `eslint.config.js`
- ハンドラーは、コンテキストの `env` 参照または分割代入を使えません。構成起点が注入した依存だけを利用します。
  - 強制: `no-restricted-syntax` → `eslint.config.js` の `files: ['packages/backend/src/modules/*/handlers/**/*.{ts,tsx}']`

### 9.5 相対インポートと公開入口

- モジュール内の同一リソースへの相対インポートは許可します。生成されたハンドラー前置きから生成ファイルを参照する相対インポートも、`Orval` の生成契約として許可します。
- リソースをまたぐ相対インポート、モジュールの親へ逃げる相対インポート、要素外ファイルへの相対インポートは `boundaries/element-types`、`boundaries/no-unknown`、または `no-restricted-imports` で禁止します。
- `@cfreact-template/backend/modules/<module>/<internal-file>` のようなモジュール深部のパッケージインポートは禁止します。別リソースのサービスは `@cfreact-template/backend/modules/<module>` だけを使います。
- モジュール要素の `capture` と既定拒否の `boundaries/element-types` により、別リソースの内部ファイルを拒否します。パッケージ形式の深いモジュールインポートは `no-restricted-imports` でも拒否します。
- `packages/backend/package.json` の `exports` は `.`、`app`、各リソースのモジュール入口、`types` だけを公開します。生成物、基盤アダプター、構成起点専用別名、モジュール内部ファイル、型ファイルのワイルドカード公開は追加しません。
- `TypeScript` の公開別名は各リソースの `index.ts` だけを解決します。構成起点が同じパッケージ内のリポジトリを構築する場合だけ、バックエンド専用の `@cfreact-template/backend/composition/modules/*` を `app` から利用できます。他の要素からこの別名を使うと `no-restricted-imports` で失敗します。

### 9.6 生成コードとスマートハンドラー

- `packages/backend/src/generated/api/**/*` は `openapi-typescript` と `Orval` が完全に所有します。`export-tsdoc/require-export-tsdoc`、手書きの型安全性、コメント、インポート整形、行数規則を適用しません。
- 生成コードにも依存方向、要素の所属、モジュールの公開入口、深いモジュールインポートの禁止は適用します。生成物を理由に境界を無効化してはいけません。
- `packages/backend/src/modules/*/handlers/**/*` は `Orval` の生成前置きと開発者が所有するスマートハンドラー本体の混在領域です。生成前置きに必要なインポート順序と型定義の例外だけを設定し、関数本体の型安全性、公開 API の TSDoc、複雑度、禁止 API、依存方向は通常どおり検査します。
- OpenAPI 型、リソース経路、検証処理、コンテキスト、`Zod` スキーマ、スマートハンドラー前置きは入力契約から再生成します。`packages/backend/src/generated/api/**` は手で編集せず、スマートハンドラーは開発者所有の関数本体だけを編集します。

### 9.7 API 契約と生成

- API 契約の正は `packages/typespec/main.tsp` です。
- `pnpm gen:api-sdk` は `TypeSpec` から OpenAPI を生成し、`openapi-typescript` のバックエンド共有型、`Orval` のリソース別 `Hono` 経路とスマートハンドラー、フロントエンド SDK を順に生成します。
- 各生成段階は書き込み前に `scripts/codegen/verify-codegen-roots.mjs` を実行し、生成ルートの実体経路をリポジトリ内へ限定して、配下のシンボリックリンクを拒否します。
- バックエンド生成では、`Orval` の実行後に `scripts/codegen/normalize-backend-handler-imports.mjs` が各ハンドラーのコンテキスト参照を型専用インポートへ正規化し、その後に `Prettier` を実行します。
- `pnpm check:codegen` は再生成後に `scripts/codegen/verify-backend-handlers.mjs` で OpenAPI のリソース `tag` と `operationId` に対するハンドラーの不足、余分、生成リソースの残骸を検出します。
- 続いて `scripts/codegen/verify-generated-artifacts.mjs` が現在の生成物と全ハンドラーディレクトリを動的に列挙し、`git ls-files --cached -z` との照合でステージ済み追加を受理しながら未追跡ファイルを拒否します。最後に `git diff --exit-code` で OpenAPI、バックエンド生成物、スマートハンドラー、フロントエンド SDK の差分を検査します。
- サーバーのルートや生成済み OpenAPI を SDK 入力の正にしません。

### 9.8 TypeScript とパッケージ公開面

- バックエンドの `TypeScript` プロジェクトは `packages/backend/tsconfig.json` 一つです。`src/**/*.ts` と `orval.config.ts` を対象にし、`pnpm --filter @cfreact-template/backend check:types` が `tsc --noEmit -p tsconfig.json` を実行します。
- ルートの `pnpm check` は全パッケージの `check` を実行するため、このバックエンド型検査を含みます。CI も `pnpm check` を実行します。
- `packages/backend/tsconfig.json` は生成物と基盤処理の内部別名、および `app` 専用のリポジトリ構築別名をバックエンド内部だけで解決します。ルートの `tsconfig.base.json` は `Cloudflare Workers`、`app`、共有型、各リソースの `index.ts` だけを公開別名として持ちます。
- `packages/backend/package.json#exports` は `.`、`./app`、`./modules/users`、`./modules/hello`、`./modules/health`、`./types` だけです。

## 10. サイズ制約

ルール

- `packages/**/src/**/*.{ts,tsx}` は 1 ファイル 1500 行以内にする
  - 強制: `pnpm lint` → `eslint .` → `rules['max-lines']` → `eslint.config.js` と `.eslintrc-maxlines.json`
  - 例外: `packages/ui/stories/**/*.stories.{ts,tsx}`
    - Story は表示例、状態、interaction、accessibility 検証を公開対象ごとの 1 ファイルへ集約する実行可能カタログのため、ファイル行数では分割しない
  - NG例
    - 1600 行の巨大ファイル
  - OK例
    - 同じ責務を行数だけで分断せず、異なるアーキテクチャ責務がある場合だけ抽出して 1500 行以内に保つ

- `packages/**/src/**/*.{ts,tsx}` は 1 関数 250 行以内にする
  - 強制: `pnpm lint` → `eslint .` → `rules['max-lines-per-function']` → `eslint.config.js` と `.eslintrc-maxlines.json`
  - 例外: `packages/ui/stories/**/*.stories.{ts,tsx}`
    - Story の `render` と `play` は 1 つの利用状態と検証手順を連続して読めることを優先し、行数だけを理由に分割しない
  - NG例
    - 300 行の関数
  - OK例
    - 同じ処理を行数だけで補助関数へ分断せず、再利用または独立した責務がある場合だけ抽出して 250 行以内に保つ

## 11. 例外

ルール

- 完全生成コードは lint の一部ルールを緩和する
  - 強制: `pnpm lint` → `eslint .` → `files: ['packages/backend/src/generated/**/*.{ts,tsx}']` と `files: ['packages/frontend/src/api/generated/**/*.{ts,tsx}']` のルール上書き → `eslint.config.js`
  - NG例
    - 生成コードを手で直しても `pnpm check:codegen` で差分が戻る
  - OK例
    - 入力元を変更して `pnpm gen:api-sdk`

- スマートハンドラーは生成前置きに必要な規則だけを緩和する
  - 強制: `pnpm lint` → `eslint .` → `files: ['packages/backend/src/modules/*/handlers/**/*.{ts,tsx}']` のルール上書き → `eslint.config.js`
  - 緩和対象: 型定義形式、型専用インポート、`require-await`、インポート順序
  - 関数本体には型安全性、TSDoc、禁止 API、依存方向、行数規則を適用する

- shadcn/ui registry 由来コードは上流API形状を保つため lint の一部ルールを緩和する
  - 強制: `pnpm lint` → `eslint .` → `files: ['packages/ui/components/**/*.{ts,tsx}', 'packages/ui/hooks/use-mobile.ts', 'packages/ui/lib/utils.ts']` のルール上書き → `eslint.config.js`
  - 対象
    - shadcn/ui のデフォルトコンポーネント実装
    - shadcn/ui が要求する `cn`, `use-mobile`
  - 補足
    - app 固有コンポーネントや hand-written の UI 追加には通常ルールを適用する
  - OK例
    - upstream registry 由来の export 形状、内部サブパス import、React 参照型は対象ファイル内で維持する

- ESLint 例外は発生頻度で管理方法を分ける
  - 単発でコード固有の例外
    - 対象行へ構造化した `eslint-disable-next-line` を置く
    - 許可ルールは `scripts/eslint/disable-policy.mjs` で管理する
  - 今後も同じAPIで繰り返す例外
    - 専用の内部境界へ処理を集約する
    - 利用側からの直接importを `project/enforce-library-boundaries` で禁止する
    - Compiler診断は専用境界ファイルだけ設定側で無効化する
  - ファイル群が同じ由来と理由を共有する例外
    - 生成コード、registry由来コード、テストのようなカテゴリ単位で設定する

- vendored OpenCode skill script は upstream tool として ESLint 対象から除外する
  - 強制: `pnpm lint` → `eslint .` → `ignores: ['.opencode/skills/impeccable/scripts/**']` → `eslint.config.js`
  - 対象
    - `npx impeccable install --providers=opencode --scope=project --no-hooks` で導入した upstream script 群
  - 補足
    - skill の agent 向け Markdown は通常どおりリポジトリ内でレビューする
  - OK例
    - upstream script は直接 lint 修正せず、必要な場合は upstream 更新または wrapper 側で対応する

- Reactと共通UIの試験は制約を一部緩和する
  - 強制: `pnpm lint` → `eslint .` → `files: ['**/*.test.*', '**/*.spec.*']` のルール上書き → `eslint.config.js`
  - NG例
    - 本番コードと同じ制約で書く必要があると思い込む
  - OK例
    - 利用者に見える描画と操作を保全するReactまたは共通UI試験では、試験用の制約緩和を利用する

## 12. 変更手順

このリポジトリで失敗条件になる自動実行

- pre-commit hook
  - 強制: `.husky/pre-commit`
  - 実行
    - `pnpm lint-staged`
    - `pnpm check:codegen`
- commit-msg hook
  - 強制: `.husky/commit-msg`
  - 実行
    - `pnpm commitlint --edit $1`

fail 条件

- `pnpm lint` は UI 再利用、ESLint、OpenSpec、サプライチェーン設定の各チェックで失敗する
  - 強制: `scripts.lint` → `package.json`
  - 内訳
    - `pnpm lint:ui-reuse` は公開 UI と Storybook catalog の対応、UI/app 間のコード clone を検査する
    - `pnpm lint:eslint` はリポジトリ全体へESLintを直接実行する
    - `pnpm lint:openspec` は `behavior-change` / `architecture-change` スキーマ検証、`pnpm exec openspec validate --all --strict`、提案検査、活動中差分を含む Scenario と試験の追跡検査、作業パッケージと設計の対象範囲検査を直接実行する
    - `pnpm lint:supply-chain` は `node scripts/security/verify-pnpm-supply-chain.mjs` を実行
- 公開 UI ごとに対応する Storybook catalog を置く
  - 強制: `pnpm lint:ui-reuse` → `scripts/ui/verify-public-component-catalog.mjs`
  - 公開 UI source、`packages/ui/package.json#exports`、`packages/ui/index.ts`、`packages/ui/stories/*.stories.tsx` の対応を検査する
  - Story は対応する `@cfreact-template/ui/*` 公開 subpath の runtime export を少なくとも一つ利用する
  - NG例
    - `packages/ui/components/button.tsx` を追加して `packages/ui/stories/button.stories.tsx` を追加しない
  - OK例
    - 公開 source と同時に対応 Story を追加し、公開 subpath から実 UI を import する
- `packages/ui` と `packages/frontend/src/app` のコードをコピーしない
  - 強制: `pnpm lint:ui-reuse` → `jscpd` → `.jscpd.json`
  - 8 行かつ 50 token 以上の cross-directory clone を検知すると失敗する
  - Story、テスト、設定ファイルは clone 検査から除外する
  - 無視用 baseline は作らず、検知した実装を共有 UI へ統合する
- サプライチェーン対策の pnpm 設定を弱めない
  - 強制: `pnpm lint:supply-chain` → `scripts/security/verify-pnpm-supply-chain.mjs`
  - 必須
    - `pnpm-workspace.yaml` の `minimumReleaseAge` は 4320 分以上
    - `allowBuilds` で install script 実行を明示許可制にする
    - `dangerouslyAllowAllBuilds: true` を禁止する
    - `minimumReleaseAgeExclude` による72時間猶予の迂回を禁止する
- `pnpm check:codegen` は生成物のドリフトで失敗する
  - 強制: `scripts.check:codegen` → `package.json`
  - 実行
    - `pnpm gen:api-sdk`
    - 各生成段階の `scripts/codegen/verify-codegen-roots.mjs` による実体経路とシンボリックリンクの事前検査
    - `node scripts/codegen/verify-backend-handlers.mjs`
    - `node scripts/codegen/verify-generated-artifacts.mjs` による現在の生成物とハンドラーディレクトリの動的列挙、および `git ls-files --cached -z` との照合
    - `git diff --exit-code -- packages/typespec/openapi/openapi.json packages/backend/src/generated/api packages/backend/src/modules/*/handlers packages/frontend/src/api/generated/client.ts`
- CI は整形、lint、型、顧客価値を守る全試験、Storybookビルド、生成差分を検証する
  - 強制: `.github/workflows/ci.yml`
  - `pnpm test:run` はReactの顧客向けUI試験、共通UIのjsdom試験、純粋で決定的なバックエンド業務・リリース規則試験だけを実行する
  - CIは設定済みのPlaywrightブラウザを導入し、Storybookブラウザ試験を`pnpm test:storybook`、価値の高い顧客作業を`pnpm test:e2e`で実行する
  - CIは`pnpm build:storybook`でStorybookの静的ビルドも検証する
  - frontendと共通UIの試験は`pnpm test:run`に含まれるため、CIで`pnpm test:frontend`または`pnpm test:ui-package`を重複実行しない
  - Workerd固有、実データベース、接続、バックエンドHTTP・OpenAPI契約、ファイルシステム・子プロセスを使うツール自己試験の実行入口は設けない

フォーマット

- 変更を含むコミットでは lint-staged が Prettier と ESLint の自動修正を走らせる
  - 強制: pre-commit hook → `pnpm lint-staged` → `.husky/pre-commit`
  - 強制: `.lintstagedrc.json`
  - 実行
    - `*.{ts,tsx,js,jsx}` は `eslint --fix` と `prettier --write`
    - `*.{json,md}` は `prettier --write`
- CI では Prettier をチェックする
  - 強制: `pnpm format:check` → `scripts.format:check` → `package.json`
  - 設定: `.prettierrc.json`
  - NG例
    ```ts
    const x = 1;
    ```
  - OK例
    ```ts
    const x = 1;
    ```

- CI では TypeSpec のフォーマットをチェックする
  - 強制: `pnpm format:check` → `scripts.format:check` → `package.json`
  - 強制: `pnpm --filter @cfreact-template/typespec format:check` → `scripts.format:check` → `packages/typespec/package.json`
  - NG例
    - `packages/typespec/**/*.tsp` の整形が崩れている
  - OK例
    ```sh
    pnpm --filter @cfreact-template/typespec format
    ```

- CI では TypeSpec がコンパイルできることをチェックする
  - 強制: CI → `pnpm check` → `.github/workflows/ci.yml`
  - 強制: `pnpm check` → `scripts.check` → `package.json`
  - 強制: `pnpm --filter @cfreact-template/typespec check` → `scripts.check` → `packages/typespec/package.json`
  - NG例
    - `packages/typespec/main.tsp` の記法ミス
  - OK例
    ```sh
    pnpm --filter @cfreact-template/typespec check
    ```

コミットメッセージ

- Conventional Commits の type は許可リストから選ぶ
  - 強制: commit-msg hook → `pnpm commitlint --edit $1` → `.husky/commit-msg`
  - 強制: `rules['type-enum']` → `commitlint.config.js`
  - 許可
    - `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
  - NG例
    ```text
    feature: add login
    ```
  - OK例
    ```text
    feat: add login
    ```

## 13. OpenSpec: 永続的な振る舞い契約を自動試験で担保する

ルール

- OpenSpec の二つの変更スキーマと全成果物は厳格検証を通す
  - 強制: `pnpm lint` → `pnpm lint:openspec` → `scripts.lint:openspec` → `package.json`
  - NG例
    - `behavior-change` または `architecture-change` のスキーマが不正
    - 活動中 Change の成果物が選択したスキーマに違反する
  - OK例
    ```sh
    pnpm lint:openspec
    ```

- 後続成果物は所有者確認済みの `request.md` から作成する
  - 強制: OpenSpecの成果物依存、`openspec/proposer`、両スキーマの成果物指示
  - NG例
    - `openspec/proposer`が所有者確認前に`request.md`を作成する
    - 背景や変更動機を確認せず、提示された解決手段からRequirementを推測する
    - 成果物の意味に関わる自明でない内容を、所有者へ質問せず補完または推測する
    - リポジトリの事実、一般的な慣行、セキュリティ上の推奨、実装上の必要性から製品Requirementを追加する
    - 明確な所有者回答を`request.md`へ反映せず、下流成果物だけへ追加する
    - `UX-Mode: CONTINUITY` で `### Continuity Source` を記載しない
    - `UX-Mode: SHAPE` で `### Primary User Task` または `### UX Direction` を記載しない
  - OK例
    - `openspec/proposer`が利用者、現状、変更動機、期待価値、望む成果を確認してRequest候補を提示し、所有者の明示確認後だけ`Request-Status: CONFIRMED`を作成する
    - `request.md`には確認済みBackground、Motivation、Request、成果制約、必須手段、確認証拠だけを記載する
    - `openspec/proposer`が自明でない意味判断を逐次確認し、背景、変更動機、期待価値を含む明確な回答を確認証拠とともにRequestへ即時反映する
    - Requestを意味境界に従って提案、Specs、設計、作業パッケージへ分配する

- OpenSpecの契約成果物は確認済みの肯定的成果だけを記録する
  - 強制: `openspec/config.yaml`、両スキーマの成果物指示、`openspec-review`
  - NG例
    - 非目標、対象外、却下案、旧実装の不在、追加しない技術または機能をRequirementにする
    - 削除した未要求の振る舞いを「その振る舞いを提供してはならない」という反対向きのRequirementへ置換する
  - OK例
    - 所有者が求める利用可能な終端状態を肯定形で記載する
    - 不要なRequirementを`REMOVED Requirements`で除去し、主仕様から消す
    - 認可された主体だけが変更できる保証を定義し、未認可要求が状態を変えないScenarioで確認する

- OpenSpec は観測可能な振る舞いの契約とし、詳細な実装計画にしない
  - 強制: `pnpm lint` → `node scripts/openspec/verify-change-task-scope.mjs` → `scripts/openspec/verify-change-task-scope.mjs`
  - NG例
    - 顧客が母語で利用できる成果ではなく、i18nのRFC準拠または使用パッケージをRequirementにする
    - 非目標または実装しない機能をRequirementにする
    - `tasks.md` をファイル、補助処理、試験階層ごとの計画へ分解する
    - `design.md` に物質的な設計判断以外の見出しを追加する
    - `design.md`で既存コード、導入済みパッケージ、実績のある外部パッケージの候補または採否を記載しない
  - OK例
    - 顧客が求める言語で利用できる終端状態をRequirementにし、規格やパッケージは設計上の手段として扱う
    - 希望体験そのものを表す可視のUI構成または配置を成果の制約として記載する
    - `Reuse Assessment`で再利用候補と採用対象を示し、独自実装時だけ全候補で成果を満たせない根拠を記載する
    - `tasks.md` を `- [ ] WP<number>: <成果>`、`Covers`、`Completion Evidence` を持つ粗い作業パッケージ台帳にする
    - ファイル、補助処理、試験の詳細は現在の作業パッケージと検証結果から実装時に段階的に決める

- Architecture Changeは全delta Spec Unitの再利用判断を能力単位で記録する
  - 強制: `pnpm lint:openspec` → `scripts/openspec/verify-change-reuse-decisions.mjs`
  - NG例
    - Requirement対応表があることを、外部パッケージ候補の調査完了と扱う
    - 認証だけを調査した報告からi18n、フォーム、検証等の採否を決める
    - 他packageの直接依存またはlockfileの推移依存を、対象packageで採用済みと扱う
    - 一つのパッケージがSpec Unit全体を満たさないことを理由に、パッケージで代替可能な下位能力まで独自実装する
  - OK例
    - 各Spec Unitを翻訳、言語照合、入力検証、永続状態等の汎用能力へ分ける
    - 再利用元分類、採用判断、対象と版、対象能力を調査範囲に含む報告を記録する
    - 同じ調査報告が複数能力を明示的に扱う場合は複数行から参照する
    - `LIMITED_COMPLEMENT`には既存資産と外部候補で代替できない証拠を記載する

- Scenario検査は仕様構造とPlaywright E2E試験からの一方向参照を検証する
  - 強制: `pnpm lint` → `node scripts/openspec/verify-scenario-coverage.mjs` → `scripts/openspec/verify-scenario-coverage.mjs`
  - NG例
    - 複数の活動中 Change が同じ Requirement へ異なる操作を指定する
    - Playwright E2E試験の題名が存在しないScenario識別子を参照する
  - OK例
    - `node scripts/openspec/verify-scenario-coverage.mjs --change <change-id>`で選択Changeの実効仕様を検査する
    - 最後に引数なしの全体検査で活動中 Change 間の相互作用を確認する
    - Scenarioから自動試験への参照欠落は検査せず、Playwright以外の試験はScenario識別子を参照しない

- Scenario 見出しは `#### Scenario:` で始め、末尾に安定 ID を付ける
  - 強制: `pnpm lint` → `node scripts/openspec/verify-scenario-coverage.mjs` → `scripts/openspec/verify-scenario-coverage.mjs` の `extractScenarioId`
  - 形式
    - `#### Scenario: ... (USER-MGMT-S001)`
  - NG例
    ```md
    #### Scenario: Create user
    ```
  - OK例
    ```md
    #### Scenario: Create user (USER-MGMT-S001)
    ```

- Scenario ID は `^[\dA-Z]+(?:-[\dA-Z]+)*-S\d{3,}$` に一致させる
  - 強制: `pnpm lint` → `node scripts/openspec/verify-scenario-coverage.mjs` → `scripts/openspec/verify-scenario-coverage.mjs` の `SCENARIO_ID_PATTERN`
  - NG例
    ```md
    #### Scenario: Create user (user-mgmt-1)
    ```
  - OK例
    ```md
    #### Scenario: Create user (USER-MGMT-S001)
    ```

- Spec に同じ Scenario ID を複数置かない
  - 強制: `pnpm lint` → `node scripts/openspec/verify-scenario-coverage.mjs` → `scripts/openspec/verify-scenario-coverage.mjs` の `validateScenarioDefinitions`
  - NG例
    - 2 つの `spec.md` に同じ ID がある
  - OK例
    - ID を一意にする

- SpecにないScenario IDをPlaywright E2E試験の題名で参照しない
  - 強制: `pnpm lint` → `node scripts/openspec/verify-scenario-coverage.mjs` → `scripts/openspec/verify-scenario-coverage.mjs` の `collectTestReferences` と `validateReferences`
  - NG例
    ```ts
    test('[USER-MGMT-S999] typo', async () => {});
    ```
  - OK例
    ```ts
    test('[USER-MGMT-S001] create user', async () => {});
    ```

## 14. プルリクエストの変更運用記録

ルール

- プルリクエスト本文に三つの独立した変更運用軸を記載する
  - 強制: `.github/workflows/validate-pr-template.yml`
  - 必須値
    - `Operation Lane`: `DIRECT`、`BEHAVIOR`、`ARCHITECTURE`
    - `UX Mode`: `NONE`、`CONTINUITY`、`SHAPE`
    - `Review Depth`: `STANDARD`、`DEEP`
  - NG例
    - `Operation Lane: BEHAVIOR` から `UX Mode: SHAPE` を暗黙に決め、UX モードを記載しない
  - OK例
    ```md
    - Operation Lane: ARCHITECTURE
    - UX Mode: CONTINUITY
    - Review Depth: DEEP
    ```

- `BEHAVIOR`と`ARCHITECTURE`はOpenSpec Changeを記載し、差分仕様を持つChangeはScenario IDも記載する
  - 強制: `.github/workflows/validate-pr-template.yml`
  - NG例
    ```md
    - Operation Lane: BEHAVIOR
    - OpenSpec Change: なし
    - Scenario IDs: なし
    ```
  - OK例
    ```md
    - Operation Lane: BEHAVIOR
    - OpenSpec Change: improve-account-recovery
    - Scenario IDs: ACCOUNT-RECOVERY-S001, ACCOUNT-RECOVERY-S002
    ```
  - 補足
    - `DIRECT` は理由付きの `なし` を使用できる
    - `skip_specs: true`の`ARCHITECTURE`は、`Scenario IDs`に理由付きの`なし`を使用できる

- 実際の UI / UX 変更ではデスクトップとモバイルの変更前後画像をすべて添付する
  - 強制: `.github/workflows/validate-pr-template.yml`
  - NG例
    - `UI / UX変更: あり` で `Mobile Before` の画像がない
  - OK例
    - `Desktop Before`、`Desktop After`、`Mobile Before`、`Mobile After` の各節に画像を添付する
