import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  RELEASE_PLAN_PATH,
  assertSingleVersion,
  extractReleaseNotes,
  parseReleasePlan,
  readWorkspacePackages,
} from './release-model.mjs';

const developRef = parseDevelopRef(process.argv.slice(2));
const rootManifest = JSON.parse(readFileSync('package.json', 'utf8'));
const releasePlan = parseReleasePlan(JSON.parse(readFileSync(RELEASE_PLAN_PATH, 'utf8')));
const workspacePackages = readWorkspacePackages();

// アプリケーションを構成する全manifestとrelease planが単一versionであることを保証します。
const version = assertSingleVersion(rootManifest, workspacePackages, releasePlan);

// release branchとmainには未消費Changesetを残さず、同じ変更の再リリースを防ぎます。
const pendingChangesets = readdirSync('.changeset').filter(
  (fileName) => fileName.endsWith('.md') && fileName !== 'README.md'
);
if (pendingChangesets.length > 0) {
  throw new Error(`Release contains unconsumed Changesets: ${pendingChangesets.join(', ')}`);
}

// package別CHANGELOGがfixed versionを含むことを確認し、Changesets生成漏れを検出します。
for (const { manifestPath } of workspacePackages) {
  const changelogPath = path.join(path.dirname(manifestPath), 'CHANGELOG.md');
  if (!existsSync(changelogPath)) {
    throw new Error(`Missing package changelog: ${changelogPath}`);
  }
  const changelog = readFileSync(changelogPath, 'utf8');
  if (!changelog.includes(`## ${version}`)) {
    throw new Error(`${changelogPath} does not contain version ${version}.`);
  }
}

// GitHub Release本文に使用するroot CHANGELOGの該当sectionが存在し、空でないことを確認します。
extractReleaseNotes(readFileSync('CHANGELOG.md', 'utf8'), version);

if (developRef !== undefined) {
  // release mergeにはdevelopの履歴を含め、mainからdevelopへの同期を通常mergeで完了可能にします。
  execFileSync('git', ['merge-base', '--is-ancestor', developRef, 'HEAD'], { stdio: 'inherit' });
}

process.stdout.write(`Validated application release v${version}.\n`);

function parseDevelopRef(arguments_) {
  // topology検査を要求する呼び出しだけがrefを渡せるよう、単一optionへ限定します。
  if (arguments_.length === 0) {
    return undefined;
  }
  if (arguments_.length === 2 && arguments_[0] === '--develop-ref') {
    return arguments_[1];
  }
  throw new Error('Usage: validate-release.mjs [--develop-ref <git-ref>]');
}
