import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

import {
  RELEASE_PLAN_PATH,
  changesetHasRelease,
  createRootChangelog,
  parseChangesetSummary,
  parseReleasePlan,
  readWorkspacePackages,
} from './release-model.mjs';

const CHANGESET_DIRECTORY = '.changeset';
const CHANGELOG_PATH = 'CHANGELOG.md';
const OVERRIDE_CHANGESET_PATH = '.changeset/release-plan-override.md';
const require = createRequire(import.meta.url);
const changesetsCliPath = require.resolve('@changesets/cli/bin.js');

const { baseRef, initialize } = parseArguments(process.argv.slice(2));

// release branchに残した手動の最低bump指定を先に読み、生成物の復元で失わないようにします。
const releasePlan = parseReleasePlan(JSON.parse(readFileSync(RELEASE_PLAN_PATH, 'utf8')));
const effectiveMinimumBump = initialize ? 'auto' : releasePlan.minimumBump;

// 最新developを唯一の生成元としてmanifest、Changeset、CHANGELOGを戻し、累積bumpを防ぎます。
restoreReleaseInputs(baseRef);

// 通常Changesetの説明をversion実行前に保持し、単一アプリケーションCHANGELOGへ集約します。
const changesets = readChangesets();
const hasDeclaredRelease = changesets.some(({ markdown }) => changesetHasRelease(markdown));

// release branchで指定された最低bumpは一時Changesetへ変換し、Changesets本来のSemVer計算へ統合します。
if (effectiveMinimumBump !== 'auto') {
  writeMinimumBumpChangeset(effectiveMinimumBump);
}

const hasRelease = hasDeclaredRelease || effectiveMinimumBump !== 'auto';
writeGitHubOutput('has_release', String(hasRelease));

if (!hasRelease) {
  // empty Changesetだけの場合はbranchとversionを作らず、次の実リリースでまとめて消費します。
  process.stdout.write('No versioned Changesets found; release preparation was skipped.\n');
} else {
  // Changesetsを1回だけ適用し、全workspaceのversionとpackage別CHANGELOGを生成します。
  run(process.execPath, [changesetsCliPath, 'version']);

  // fixed groupの結果を検証し、ルートmanifestをアプリケーション版の参照点へ同期します。
  const version = synchronizeRootVersion();

  // lockfileをmanifestの生成結果へ追従させ、release PRでfrozen installが成功する状態にします。
  run('pnpm', ['install', '--lockfile-only', '--ignore-scripts']);

  // 顧客向けの単一CHANGELOGとrelease planを更新し、GitHub Releaseの入力を確定します。
  writeApplicationReleaseMetadata(version, effectiveMinimumBump, changesets);
  writeGitHubOutput('version', version);
  process.stdout.write(`Rendered application release v${version}.\n`);
}

function parseArguments(arguments_) {
  // workflowとローカル検証で同じentrypointを使うため、許可した引数だけを明示的に解釈します。
  let baseRefValue = 'origin/develop';
  let initializeValue = false;
  const remainingArguments = [...arguments_];
  while (remainingArguments.length > 0) {
    const argument = remainingArguments.shift();
    if (argument === '--initialize') {
      initializeValue = true;
      continue;
    }
    if (argument === '--base-ref') {
      const value = remainingArguments.shift();
      if (value === undefined || value.startsWith('-')) {
        throw new Error('--base-ref requires a git ref.');
      }
      baseRefValue = value;
      continue;
    }
    throw new Error(`Unsupported argument: ${argument}`);
  }
  return { baseRef: baseRefValue, initialize: initializeValue };
}

function restoreReleaseInputs(reference) {
  // release管理対象manifestをdevelop版へ戻し、手動package version編集を入力にしません。
  const manifestPaths = [
    'package.json',
    ...readWorkspacePackages().map(({ manifestPath }) => manifestPath),
  ];
  for (const manifestPath of manifestPaths) {
    restoreGitFile(reference, manifestPath, true);
  }

  // 前回の自動生成CHANGELOGを除去し、リリース済み履歴だけをdevelopから復元します。
  const changelogPaths = [
    CHANGELOG_PATH,
    ...manifestPaths
      .slice(1)
      .map((manifestPath) => path.join(path.dirname(manifestPath), CHANGELOG_PATH)),
  ];
  for (const changelogPath of changelogPaths) {
    restoreGitFile(reference, changelogPath, false);
  }

  // developに残る全Changesetを復元し、release branchで既に消費したファイルも再計算へ含めます。
  rmSync(CHANGESET_DIRECTORY, { recursive: true, force: true });
  mkdirSync(CHANGESET_DIRECTORY, { recursive: true });
  const changesetPaths = listGitTreeFiles(reference, CHANGESET_DIRECTORY);
  for (const changesetPath of changesetPaths) {
    restoreGitFile(reference, changesetPath, true);
  }
}

function restoreGitFile(reference, filePath, required) {
  // git objectから直接内容を取得し、working tree全体をresetせず生成対象だけを安全に復元します。
  const result = spawnSync('git', ['show', `${reference}:${filePath}`], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status === 0) {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, result.stdout);
    return;
  }
  if (required) {
    throw new Error(`Could not restore ${filePath} from ${reference}: ${result.stderr.trim()}`);
  }
  rmSync(filePath, { force: true });
}

function listGitTreeFiles(reference, directory) {
  // 指定refで追跡されるファイルだけを列挙し、release branch固有ファイルを混入させません。
  const output = execFileSync('git', ['ls-tree', '-r', '--name-only', reference, '--', directory], {
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((value) => value.trim())
    .filter((value) => value !== '');
}

function readChangesets() {
  // READMEを除くMarkdownを安定順で読み、version計算とroot CHANGELOGで同じ集合を使用します。
  if (!existsSync(CHANGESET_DIRECTORY)) {
    return [];
  }
  return readdirSync(CHANGESET_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.md') && fileName !== 'README.md')
    .sort()
    .map((fileName) => ({
      fileName,
      markdown: readFileSync(path.join(CHANGESET_DIRECTORY, fileName), 'utf8'),
    }));
}

function writeMinimumBumpChangeset(bump) {
  // fixed groupの先頭packageへ最低bumpを与えれば、Changesetsが全packageへ同じversionを適用します。
  const [{ manifest }] = readWorkspacePackages();
  if (typeof manifest.name !== 'string' || manifest.name === '') {
    throw new TypeError('The canonical workspace package must have a name.');
  }
  writeFileSync(
    OVERRIDE_CHANGESET_PATH,
    `---\n"${manifest.name}": ${bump}\n---\n\nリリース責任者が${bump}以上のバージョン更新を指定しました。\n`
  );
}

function synchronizeRootVersion() {
  // Changesets実行後のworkspace versionが全て一致することを確認し、root versionへ反映します。
  const workspacePackages = readWorkspacePackages();
  const versions = new Set(workspacePackages.map(({ manifest }) => manifest.version));
  if (versions.size !== 1) {
    throw new Error(
      `Changesets fixed group produced different versions: ${[...versions].join(', ')}`
    );
  }
  const [version] = versions;
  if (typeof version !== 'string') {
    throw new TypeError('Changesets did not produce a workspace version.');
  }
  const rootManifest = JSON.parse(readFileSync('package.json', 'utf8'));
  rootManifest.version = version;
  writeFileSync('package.json', `${JSON.stringify(rootManifest, null, 2)}\n`);
  return version;
}

function writeApplicationReleaseMetadata(version, minimumBump, changesets) {
  // synthetic指定を含む実リリース説明を収集し、空の説明はroot CHANGELOGから除外します。
  const summaries = changesets.map(({ markdown }) => parseChangesetSummary(markdown));
  if (minimumBump !== 'auto') {
    summaries.push(`リリース責任者が${minimumBump}以上のバージョン更新を指定しました。`);
  }
  const rootManifest = JSON.parse(readFileSync('package.json', 'utf8'));
  const previousChangelog = existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, 'utf8') : '';
  writeFileSync(
    CHANGELOG_PATH,
    createRootChangelog(rootManifest.name, version, summaries, previousChangelog)
  );
  writeFileSync(RELEASE_PLAN_PATH, `${JSON.stringify({ minimumBump, version }, null, 2)}\n`);
}

function run(command, arguments_) {
  // 子processの標準入出力をそのまま公開し、Changesetsやpnpmの失敗理由をCIログへ残します。
  execFileSync(command, arguments_, { stdio: 'inherit' });
}

function writeGitHubOutput(name, value) {
  // GitHub Actionsでは後続stepへ結果を渡し、ローカル実行では追加ファイルを作りません。
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath === undefined || outputPath.trim() === '') {
    return;
  }
  writeFileSync(outputPath, `${name}=${value}\n`, { flag: 'a' });
}
