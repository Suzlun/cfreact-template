# コーディング規則

本書はこのリポジトリにおける「コーディング規則（憲法）」です。  
ESLint/TypeScript/Prettier は規則を自動で検査・整形するための手段であり、規則そのものは本書で定義します。

## 1. 本書の位置付け

- 正（Source of Truth）: `docs/CODING_STANDARDS.md`
- 自動検査（追従物）: `eslint.config.js` ほか各種設定
- 乖離が見つかった場合は、意図に応じて **本書 → 設定 → 実装** の順で整合させる

## 2. 目的

- 依存方向と責務を固定し、変更に強い構造を維持する
- 画面/UI、HTTP、永続化、ドメインロジックを混ぜない
- 型安全性・セキュリティ・可読性を “個人差” ではなく “規約” にする

## 3. プロジェクト構造

### 3.1 クライアント

- `packages/client/app`
  - UI 層（pages/components/router）
  - 表示・画面遷移・最小限の状態（原則 `useState`）を担当
- `packages/client/domain`
  - ドメインフック層（TanStack Query 等による状態/副作用/キャッシュ）
  - UI から見た「画面ロジックの API」を提供
- `packages/client/api`
  - 通信/SDK 層（OpenAPI 生成物 + 薄いラッパー）
  - React に依存しない

### 3.2 サーバー

- `packages/server/entry`
  - 起動点（Workers のエントリーポイント）
  - 役割: `server-app` を呼ぶことに専念する（業務ロジックを書かない）
- `packages/server/app`
  - 配線/DI（依存注入・組み立て）
  - 役割: `env` や実装差し替えをここで閉じる。`server-http` へ依存を注入する
- `packages/server/http`
  - HTTP アダプタ（入出力変換・ルーティング）
  - 役割: HTTP → ドメイン入力へ変換し UseCase を呼ぶ。永続化に直接触らない
- `packages/server/usecases`
  - ユースケース（アプリケーションの振る舞い）
  - 役割: ドメインを操作し、必要なポート（Repository 等）を介して外側へ要求する
- `packages/server/domain`
  - ドメイン（最も安定した中心）
  - 役割: エンティティ/値/ドメインルール/Repository IF 等を定義する
- `packages/server/persistence`
  - 永続化アダプタ（DB/外部 I/O 実装）
  - 役割: Domain のインターフェースを実装し、DB 等の具体に接続する
- `packages/server/types`
  - 共有型（bindings 等）
  - 役割: 型定義を中心に置く（副作用や I/O を置かない）

### 3.3 共通パッケージ

- `packages/ui`（UI 部品/テーマ。`@ui/*` を使用）
- `packages/drizzle`（スキーマ等。`@drizzle/*` を使用）

## 4. 依存方向

依存方向はこのプロジェクトの根幹です。例外は最小にしてください。

### 4.1 クライアント

- `app → domain → api` の順に依存する
- `app` から `api` を直接参照しない（必ず `domain` を介す）
- `domain` は `app`（pages/components）に依存しない

### 4.2 サーバー

- `entry → app → (http/persistence/usecases) → domain → types` の順に依存する
- `domain` / `usecases` はインフラに依存しない（HTTP/DB/フレームワークを知らない）
- `http` は `persistence` を直接参照しない（UseCase 経由にする）

### 4.3 依存方向の許可表

サーバー:

| from                 | 許可                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `server-domain`      | `server-domain`, `server-types`                                                         |
| `server-types`       | `server-types`                                                                          |
| `server-usecases`    | `server-domain`, `server-usecases`, `server-types`                                      |
| `server-persistence` | `server-usecases`, `server-domain`, `server-types`, `server-persistence`                |
| `server-http`        | `server-http`, `server-usecases`, `server-domain`, `server-types`                       |
| `server-app`         | `server-http`, `server-persistence`, `server-usecases`, `server-domain`, `server-types` |
| `server-entry`       | `server-app`                                                                            |

クライアント:

| from            | 許可                          |
| --------------- | ----------------------------- |
| `client-api`    | `client-api`                  |
| `client-domain` | `client-domain`, `client-api` |
| `client-app`    | `client-app`, `client-domain` |

## 5. import / export

### 5.1 エイリアスを使う

- サーバー（`packages/server/**/src`）は上位ディレクトリ参照（`../`）を禁止し、`@cfreact-template-server/*` を使う
- `packages/ui/src` は `@ui/*` を使う
- `packages/drizzle/src` は `@drizzle/*` を使う

狙い: 依存関係を読みやすくし、移動/分割に強くする。

### 5.2 `index.ts` は公開境界

`index.ts` は “外部に見せる API の目録” です。実装を置きません。

- `index.ts` には実装を書かない（再エクスポートのみ）
- `index.ts` で `default export` をしない

### 5.3 deep import をしない

- ディレクトリ配下のファイルを直接 import しない
- “必要なもの” は、そのディレクトリの `index.ts` から export して利用する

### 5.4 import の表記

- import の拡張子は付けない（`.ts/.tsx/.js/.jsx/.mjs/.cjs` など）
- `packages/` 配下の TS/TSX から `.js/.mjs/.cjs` を import しない
- import は `builtin → external → internal → relative → type` を基本順序とし、グループ間に空行を入れる
- 同一グループ内はアルファベット順を基本とする（レビューで揺れないようにする）

internal 扱い（例）:

- `@cfreact-template-client/**`
- `@cfreact-template-server/**`
- `@cfreact-template/ui/**`
- `@cfreact-template/drizzle/**`
- `@ui/**`
- `@drizzle/**`

### 5.5 ESLint 無効化コメントの運用

無効化は “例外” です。理由が説明できない無効化は入れません。

- 無効化する場合は説明を書いて最小範囲に閉じる
- 使っていない disable を残さない
- `disable` したら `enable` をペアにする（無期限 disable を避ける）

### 5.6 フォーマット

フォーマットは Prettier を正とし、手で整形ルールを増やしません。

- `printWidth: 100`
- `tabWidth: 2` / `semi: true` / `singleQuote: true`
- `trailingComma: "es5"` / `endOfLine: "lf"`

## 6. 公開 API のドキュメント

“外に出すもの” は保守負債になりやすいので、説明を必須にします。

- `packages/**/src/**/*.{ts,tsx}` の export には TSDoc（`/** ... */`）を付ける
- 例外は最小にし、必要なら理由を残す（コメント/PR 説明）

## 7. TypeScript

### 7.1 禁止事項

- `any` で型を逃げない
- unsafe な代入/呼び出し/メンバーアクセスを放置しない

### 7.2 原則

- `null`/`undefined` を前提にせず、分岐や型で表現する
- 真偽値条件を曖昧にしない（文字列/数値の truthy 判定に頼らない）
- `Promise` を握りつぶさない（戻り値を返す/`await` する/明示的に扱う）
- `import type` を優先し、型と実装の依存を分離する
- 未使用は削除する（意図的に未使用なら `_` prefix を付ける）
- できるだけ `optional chaining` と `nullish coalescing` を使い、分岐の意図を明確にする

### 7.3 セキュリティ

- `eval` / `new Function` 相当を使わない
- URL/HTML/外部入力を信用せず、境界で検証・サニタイズする

### 7.4 コード品質

- `debugger` を残さない
- `alert` を使わない
- `var` を使わない（`const` を基本にし、必要な場合のみ `let`）
- 可能な限り `forEach` を避け、`for...of` 等で制御フローを明確にする

## 8. クライアント実装規則

### 8.1 `client-api`

- React に依存しない（hooks/コンポーネントを置かない）
- 生成コード（例: `src/generated/**`）は手で編集しない
- DTO を UI に漏らさない（変換は `api` または `domain` で完結させる）

### 8.2 `client-domain`

hooks は UI から見た “アプリの API” です。UI 依存を持たせません。

- export できる “値” は `useXxx` のカスタムフックのみ（型 export は可）
- hook 名は `use` 始まり（`useXxx`）に統一する
- 戻り値は `{ data, actions }` の形に統一する（どちらも必須）
- `data` の型は `*Data`、`actions` の型は `*Actions` に統一する
- 少なくとも 1 つは React/TanStack Query 等の hook を使い、状態・副作用・キャッシュを扱う
- `client-app`（pages/components）を import しない
- `apiClient` をそのまま返す/再エクスポートしない
- hooks 配下のファイル名は `camelCase` に統一する
- hooks から UI 層（`app/pages/components`）へ “逆流” する import を作らない（循環参照の温床になる）

### 8.3 `client-app`

UI 層は “薄く” 保ちます。ロジックは `client-domain` に寄せます。

共通:

- `client-api` を直接 import しない（domain hooks 経由）
- `fetch` を直接呼ばない（共有のクライアントを経由）
- `axios`/`cross-fetch` 等を持ち込まない（通信は 1 箇所に集約）
- pages/components から `client-domain` を参照する場合は、集約エントリに依存せず “必要なものだけ” を import する
- `dangerouslySetInnerHTML` を使わない（HTML が必要なら安全な経路でサニタイズする）

pages（画面）:

- `useState` 以外の React 組み込み hooks を pages で直接使わない（hooks 層へ委譲）
- `useMemo`/`useCallback` は pages で使わない（最適化判断は components/hooks へ）
- `pages/` 直下に TSX を置かない（必ずサブディレクトリを作る）
- pages で直接使わないもの（例）:
  - `useEffect`, `useLayoutEffect`, `useInsertionEffect`
  - `useReducer`, `useRef`, `useImperativeHandle`
  - `useTransition`, `useDeferredValue`, `useId`, `useSyncExternalStore`
  - `useOptimistic`, `useActionState`

components（表示部品）:

- 状態管理に `useState` を使わない（状態は pages か hooks に寄せる）
- `useMemo`/`useCallback` 以外の React 組み込み hooks を使わない（副作用・非同期は hooks へ）
- components で許可する hooks は `useMemo`/`useCallback` のみ（状態/副作用は hooks に寄せる）

## 9. サーバー実装規則

### 9.1 `server-domain` / `server-usecases`

内側（domain/usecases）は外側（HTTP/DB/フレームワーク）を知りません。

- `fetch` / `Request` / `Response` / `Headers` を直接使わない
- Hono/Drizzle/Cloudflare SDK 等の import をしない
- Zod / `@hono/zod-openapi` を import しない
- Adapters（`http`/`persistence`）を参照しない
- `console` を使わない（観測が必要なら外側で）

### 9.2 `server-http`

- ルーティングと入出力変換に専念し、UseCase を呼ぶ
- `persistence` を直接参照しない（UseCase 経由）
- `c.env` を直接参照しない（`server-app` が注入する依存を使う）
- API 契約の正（Single Source of Truth）は TypeSpec（`packages/api-contract`）とする
- `server-http` は TypeSpec で定義された契約に準拠して実装する（ルート追加/変更は必ず TypeSpec を先に更新する）
- `@hono/zod-openapi` + `zod` は実装側のリクエスト検証・型安全化のために使用してよいが、契約の正にしない
- Zod スキーマは `packages/server/http/src/schemas` に集約し、`zod` の import は同ディレクトリ内に限定する
- `createRoute` / `OpenAPIHono` は `packages/server/http/src/routes` 以外で import しない
- 手書きの Swagger/OpenAPI は禁止（`packages/api-contract/openapi/openapi.json` は生成物）
- API 変更時は `pnpm gen:api-sdk` を実行して OpenAPI と SDK を更新する
- デモ用途のルートは追加しない（必要なら正式な API として OpenAPI 定義に含める）

### 9.3 `server-persistence`

- Domain のインターフェースを実装する（内側に合わせる）
- `usecases/domain/types` への依存は可、`http` への依存は不可

### 9.4 `server-app` / `server-entry`

- `server-entry` は起動点。業務ロジックを書かない
- `server-app` は依存注入/組み立て。`env` や実装の差し替えはここで閉じる

## 10. サイズ制約

“動く” より先に “読める/直せる” を守ります。

- 1ファイルは概ね 500 行以内に分割する
- 1関数は概ね 100 行以内に分割する

## 11. 例外

- 生成コード（例: `packages/client/api/src/generated/**`）は編集しない。規則は一部緩和される
- テスト（`*.test.*`, `*.spec.*`）は実用上の都合で規則を一部緩和する
- 設定ファイルは実装都合で一部緩和されることがある

## 12. 変更手順

- 目的（解決したい問題）と影響範囲を Issue/PR に書く
- 本書を更新し、必要なら自動検査（ESLint/設定）も追従させる
- 既存コードに影響がある場合は移行方針を明記する

## 13. OpenSpec: 仕様を自動テストで担保する

このリポジトリでは OpenSpec の spec を「振る舞いの契約」として扱い、実装が spec から逸脱しないことを Lint/CI で検査します。

### 13.1 Spec の置き場所

- 正（Source of Truth）: `openspec/specs/<capability>/spec.md`
- 変更提案（作業中）: `openspec/changes/<change>/specs/<capability>/spec.md`（delta spec）

### 13.2 Scenario ID（必須）

全ての Scenario は安定 ID を持ちます。ID はレビュー/テスト/追跡のための鍵です。

- Scenario 見出しは末尾に ID を付ける
  - `#### Scenario: ... (USER-MGMT-S001)`
- ID 形式（固定）: `^[A-Z0-9]+(?:-[A-Z0-9]+)*-S\d{3,}$`
  - 例: `AUTH-SESSION-S001`, `USER-MGMT-S012`

### 13.3 テストでの参照（必須）

自動テストは Scenario ID をタイトルに含めて、spec と結び付けます。

- Vitest/Jest:
  - `it('[USER-MGMT-S001] ...', async () => { ... })`
  - `test('[USER-MGMT-S001] ...', async () => { ... })`
- Playwright:
  - `test('[USER-MGMT-S001] ...', async ({ page }) => { ... })`

### 13.4 例外（manual）

自動化が現実的でない Scenario は明示的に manual 扱いにします（暗黙の未テストは不可）。

- Scenario 見出し直下に `Tags: manual` を追加する

例:

```md
#### Scenario: Third-party payment settles eventually (PAYMENTS-S014)

Tags: manual

- GIVEN ...
- WHEN ...
- THEN ...
```

### 13.5 自動検査（Lint/CI）

`pnpm lint` は以下を検査します。

- `openspec validate --all --strict`（OpenSpec の構造検証）
- Scenario ID カバレッジ:
  - spec に存在する Scenario ID が、テストコードから参照されている
  - テストが参照している Scenario ID が、spec 側に存在する
  - Scenario ID が重複しない

注: Scenario ID カバレッジの対象は `openspec/specs/**` です。`openspec/changes/**` の delta spec は、`/opsx-sync` または `openspec archive` 等で main spec に反映した上で検査対象になります。

実装や仕様を変更したら、spec とテストをセットで更新してください。
