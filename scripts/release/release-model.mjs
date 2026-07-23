import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const RELEASE_BRANCH = 'release';
export const SYNC_BRANCH = 'sync/main-to-develop';
export const RELEASE_PLAN_PATH = '.release/plan.json';

const CHANGESET_PATH_PATTERN = /^\.changeset\/(?!README\.md$)[^/]+\.md$/;
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const BUMP_TYPES = new Set(['auto', 'patch', 'minor', 'major']);

export function isAddedChangesetFile(file) {
  // PR差分では新規Changesetだけを受け付け、既存の未消費Changesetを書き換える迂回を防ぎます。
  return file.status === 'added' && CHANGESET_PATH_PATTERN.test(file.filename);
}

export function isTrustedSyncPullRequest(pullRequest, repository) {
  // 同期PRの除外は同一repositoryの固定branchだけに限定し、forkから同名branchを作る回避を拒否します。
  return pullRequest.head?.ref === SYNC_BRANCH && pullRequest.head?.repo?.full_name === repository;
}

export function getMergedAutomationBranch(pullRequest, repository) {
  // merge済みの同一repository内固定PRだけをcleanup対象にし、任意branchの削除を防ぎます。
  if (pullRequest?.merged !== true || pullRequest.head?.repo?.full_name !== repository) {
    return undefined;
  }
  if (pullRequest.base?.ref === 'main' && pullRequest.head?.ref === RELEASE_BRANCH) {
    return RELEASE_BRANCH;
  }
  if (pullRequest.base?.ref === 'develop' && pullRequest.head?.ref === SYNC_BRANCH) {
    return SYNC_BRANCH;
  }
  return undefined;
}

export function parseReleasePlan(value) {
  // JSONの型と許可値を境界で検証し、不正な手動指定をChangesetsへ渡しません。
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${RELEASE_PLAN_PATH} must contain a JSON object.`);
  }
  const minimumBump = value.minimumBump;
  const version = value.version;
  if (typeof minimumBump !== 'string' || !BUMP_TYPES.has(minimumBump)) {
    throw new Error(`${RELEASE_PLAN_PATH} minimumBump must be auto, patch, minor, or major.`);
  }
  if (typeof version !== 'string' || !SEMVER_PATTERN.test(version)) {
    throw new Error(`${RELEASE_PLAN_PATH} version must be a stable semantic version.`);
  }
  return { minimumBump, version };
}

export function readWorkspacePackages(rootDirectory = process.cwd()) {
  // pnpm-workspace.yamlの`packages/*`契約に合わせ、各workspace manifestを安定した順序で収集します。
  const packagesDirectory = path.join(rootDirectory, 'packages');
  return readdirSync(packagesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join('packages', entry.name, 'package.json'))
    .filter((manifestPath) => {
      try {
        readFileSync(path.join(rootDirectory, manifestPath));
        return true;
      } catch {
        return false;
      }
    })
    .sort()
    .map((manifestPath) => ({
      manifestPath,
      manifest: JSON.parse(readFileSync(path.join(rootDirectory, manifestPath), 'utf8')),
    }));
}

export function assertSingleVersion(rootManifest, workspacePackages, releasePlan) {
  // ルート、全workspace、release planが同じ版を指すことを確認し、部分的なリリースを禁止します。
  const versions = new Set([
    rootManifest.version,
    releasePlan.version,
    ...workspacePackages.map(({ manifest }) => manifest.version),
  ]);
  if (versions.size !== 1) {
    throw new Error(`Application versions must match: ${[...versions].join(', ')}`);
  }
  const [version] = versions;
  if (typeof version !== 'string' || !SEMVER_PATTERN.test(version)) {
    throw new Error('Application version must be a stable semantic version.');
  }
  return version;
}

export function parseChangesetSummary(markdown) {
  // ChangesetのYAML front matterを除き、利用者が記述した変更説明だけをリリースノートへ渡します。
  const closingMarkerIndex = markdown.indexOf('\n---', 3);
  if (!markdown.startsWith('---\n') || closingMarkerIndex === -1) {
    throw new Error('Changeset must contain YAML front matter enclosed by --- markers.');
  }
  return markdown.slice(closingMarkerIndex + 4).trim();
}

export function changesetHasRelease(markdown) {
  // front matterが空のChangesetは明示的なリリース対象外として扱い、バージョン更新を発生させません。
  const closingMarkerIndex = markdown.indexOf('\n---', 3);
  if (!markdown.startsWith('---\n') || closingMarkerIndex === -1) {
    throw new Error('Changeset must contain YAML front matter enclosed by --- markers.');
  }
  return markdown.slice(4, closingMarkerIndex).trim() !== '';
}

export function validateChangesetMarkdown(markdown) {
  // Changesets CLIが生成するfront matter形式だけを受け付け、未知のbumpや壊れたYAMLをmerge前に拒否します。
  const closingMarkerIndex = markdown.indexOf('\n---', 3);
  if (!markdown.startsWith('---\n') || closingMarkerIndex === -1) {
    throw new Error('Changeset must contain YAML front matter enclosed by --- markers.');
  }
  const frontMatter = markdown.slice(4, closingMarkerIndex).trim();
  if (frontMatter === '') {
    return;
  }
  const declarationPattern = /^(["'])[^"']+\1:\s+(patch|minor|major)$/;
  const declarations = frontMatter.split('\n').map((line) => line.trim());
  if (declarations.some((declaration) => !declarationPattern.test(declaration))) {
    throw new Error('Changeset declarations must use "package-name": patch|minor|major format.');
  }
}

export function createRootChangelog(rootName, version, summaries, previousChangelog = '') {
  // workspace別CHANGELOGとは別に、顧客が読む単一アプリケーションの変更履歴を先頭へ生成します。
  const title = `# ${rootName}`;
  const entries = summaries
    .filter((summary) => summary !== '')
    .map((summary) => `- ${summary.replaceAll('\n', '\n  ')}`)
    .join('\n');
  const releaseSection = `## ${version}\n\n${entries}\n`;
  const normalizedPrevious = previousChangelog.trim();
  if (normalizedPrevious === '') {
    return `${title}\n\n${releaseSection}`;
  }
  const previousBody = normalizedPrevious.startsWith(`${title}\n`)
    ? normalizedPrevious.slice(title.length).trim()
    : normalizedPrevious;
  return `${title}\n\n${releaseSection}\n${previousBody}\n`;
}

export function extractReleaseNotes(changelog, version) {
  // 対象versionの見出しから次のversion見出しまでを抽出し、GitHub Release本文を一意にします。
  const marker = `## ${version}`;
  const startIndex = changelog.indexOf(marker);
  if (startIndex === -1) {
    throw new Error(`CHANGELOG.md does not contain ${marker}.`);
  }
  const contentStart = startIndex + marker.length;
  const nextVersionIndex = changelog.indexOf('\n## ', contentStart);
  const notes = changelog.slice(
    contentStart,
    nextVersionIndex === -1 ? undefined : nextVersionIndex
  );
  if (notes.trim() === '') {
    throw new Error(`CHANGELOG.md release notes for ${version} are empty.`);
  }
  return notes.trim();
}

export function createPullRequestBody(kind, version) {
  // 自動PRもrepository標準テンプレートの全項目を埋め、通常PRと同じレビュー情報を提供します。
  const isRelease = kind === 'release';
  const purpose = isRelease
    ? `Changesetsで集約したアプリケーション版v${version}をmainへ反映する。`
    : `リリース済みのmainをdevelopへ同期する。`;
  const mainChange = isRelease
    ? '未消費Changesetの反映、単一バージョン更新、CHANGELOG更新。'
    : 'mainのリリースコミットをdevelopへmerge commitで反映。';
  const impact = isRelease
    ? `v${version}の本番リリース候補を確定する。`
    : '次の開発をリリース済み状態から継続できる。';
  return `## 概要

- 目的: ${purpose}
- 主な変更: ${mainChange}

## 顧客価値

- 利用者: このテンプレートから作成したアプリケーションの利用者と開発者
- 改善される体験: ${impact}

## 変更内容

- 変更内容: ${mainChange}

## 関連Issue / OpenSpec

- Issue: なし（理由: リリース運用の自動PR）
- OpenSpec Change: なし（理由: リリース実行はOpenSpec完了境界の対象外）
- Scenario ID: なし（理由: リリース運用の自動PR）

## セキュリティ確認

- [x] 認証・認可の境界を確認した（GitHub Appの限定権限だけを使用）
- [x] ユーザー入力の検証・無害化を確認した（固定branchとSemVerを検証）
- [x] 秘密情報・トークン・個人情報をログやレスポンスに含めていない
- [x] 新規依存関係やビルドスクリプトのリスクを確認した

## 仕様・API契約

- [x] TypeSpec変更の要否を確認した（自動PR固有の変更なし）
- [x] API SDK再生成の要否を確認した（CIのcodegen driftで確認）
- [x] Codegen drift確認の要否を確認した（CIで実行）
- [x] OpenSpec Scenario IDとテスト名の対応を確認した（自動PR固有の変更なし）

## アーキテクチャ確認

- [x] フロントエンドの依存方向を守っている
- [x] バックエンドの依存方向を守っている
- [x] 同一レイヤー内の重複実装を増やしていない
- [x] 不要なコード・未使用機能・仮置きを残していない

## UI / UX変更

- UI / UX変更: なし
- UI / UX変更の説明: 自動PRが追加するリリースメタデータ自体にはUI変更なし
- 影響範囲: 個別変更のUI影響は各develop向けPRで確認済み
- デスクトップ確認: 個別変更のPRとCIで確認
- モバイル確認: 個別変更のPRとCIで確認
- アクセシビリティ確認: 個別変更のPRとStorybookテストで確認

### UI / UXスクリーンショット

#### Desktop Before

なし（理由: 自動PR固有のUI変更なし）

#### Desktop After

なし（理由: 自動PR固有のUI変更なし）

#### Mobile Before

なし（理由: 自動PR固有のUI変更なし）

#### Mobile After

なし（理由: 自動PR固有のUI変更なし）

#### Dark Mode

なし（理由: 自動PR固有のUI変更なし）

## DB / マイグレーション

- DB変更: 個別変更のPRで確認済み
- マイグレーション: 個別変更のPRで確認済み
- データ影響: 個別変更のPRで確認済み

## テスト

- 実行した確認: GitHub Actionsのrequired checks
- 未実行の確認と理由: なし（repositoryで定義した検証をCIで実行）

## レビュー観点

- 重点確認箇所: バージョン、CHANGELOG、Changeset消費、branch差分

## リリース影響

- 環境変数: 変更なし
- 設定変更: ${isRelease ? 'アプリケーション版を更新' : '変更なし'}
- 運用影響: ${impact}
`;
}
