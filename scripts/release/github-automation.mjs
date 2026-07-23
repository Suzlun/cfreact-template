import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

import {
  RELEASE_BRANCH,
  RELEASE_PLAN_PATH,
  SYNC_BRANCH,
  createPullRequestBody,
  extractReleaseNotes,
  getMergedAutomationBranch,
  parseReleasePlan,
} from './release-model.mjs';

const GIT_SHA_PATTERN = /^[\da-f]{40}$/;
const AUTOMATION_CHECKS = ['verify', 'Validate PR Template', 'Require Changeset'];
const command = process.argv[2];
const token = requireEnvironmentValue('GITHUB_TOKEN');
const repository = requireEnvironmentValue('GITHUB_REPOSITORY');
const [owner, repositoryName] = repository.split('/');

// repository識別子を厳密に検証し、別repositoryへ書き込む誤設定を停止します。
if (owner === undefined || repositoryName === undefined || repository.split('/').length !== 2) {
  throw new Error('GITHUB_REPOSITORY must use owner/repository format.');
}

switch (command) {
  case 'get-release-pr':
    await writePullRequestLookup('main', RELEASE_BRANCH);
    break;
  case 'get-sync-pr':
    await writePullRequestLookup('develop', SYNC_BRANCH);
    break;
  case 'upsert-release-pr':
    await upsertPullRequest('release');
    break;
  case 'upsert-sync-pr':
    await upsertPullRequest('sync');
    break;
  case 'dispatch-pr-checks':
    await dispatchPullRequestChecks();
    break;
  case 'dispatch-deploy':
    await dispatchDeploy();
    break;
  case 'complete-sync-pr':
    await completeSyncPullRequest();
    break;
  case 'comment-pr':
    await commentPullRequest();
    break;
  case 'publish-release':
    await publishRelease();
    break;
  case 'detect-release-commit':
    await detectReleaseCommit();
    break;
  case 'delete-merged-branch':
    await deleteMergedBranch();
    break;
  default:
    throw new Error(`Unsupported GitHub automation command: ${command ?? ''}`);
}

async function writePullRequestLookup(baseBranch, headBranch) {
  // 同じbase/headを持つopen PRだけを取得し、無関係なrelease風branchを更新しません。
  const pullRequest = await findOpenPullRequest(baseBranch, headBranch);
  writeGitHubOutput('exists', String(pullRequest !== undefined));
  if (pullRequest !== undefined) {
    writeGitHubOutput('number', String(pullRequest.number));
  }
}

async function findOpenPullRequest(baseBranch, headBranch) {
  // head条件へownerを含め、fork上の同名branchを自動化対象から除外します。
  const query = new globalThis.URLSearchParams({
    state: 'open',
    base: baseBranch,
    head: `${owner}:${headBranch}`,
    per_page: '10',
  });
  const pullRequests = await githubRequest(`/repos/${repository}/pulls?${query.toString()}`);
  if (!Array.isArray(pullRequests)) {
    throw new TypeError('GitHub pull request list response must be an array.');
  }
  if (pullRequests.length > 1) {
    throw new Error(`Multiple open pull requests found for ${headBranch} -> ${baseBranch}.`);
  }
  return pullRequests[0];
}

async function upsertPullRequest(kind) {
  // releaseと同期の固定branch契約からbase、head、title、本文を一意に組み立てます。
  const isRelease = kind === 'release';
  const baseBranch = isRelease ? 'main' : 'develop';
  const headBranch = isRelease ? RELEASE_BRANCH : SYNC_BRANCH;
  const releasePlan = parseReleasePlan(JSON.parse(readFileSync(RELEASE_PLAN_PATH, 'utf8')));
  const title = isRelease
    ? `chore(release): v${releasePlan.version}`
    : `chore(release): sync main into develop after v${releasePlan.version}`;
  const body = createPullRequestBody(kind, releasePlan.version);
  const existingPullRequest = await findOpenPullRequest(baseBranch, headBranch);

  let pullRequest;
  if (existingPullRequest === undefined) {
    // repository固有のGITHUB_TOKENでPRを作り、利用者identityや永続credentialへの依存を排除します。
    pullRequest = await githubRequest(`/repos/${repository}/pulls`, {
      method: 'POST',
      body: JSON.stringify({ base: baseBranch, head: headBranch, title, body }),
    });
  } else {
    // 既存PRの番号とreview履歴を維持し、versionと説明だけを最新状態へ更新します。
    pullRequest = await githubRequest(`/repos/${repository}/pulls/${existingPullRequest.number}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, body }),
    });
  }

  writeGitHubOutput('number', String(pullRequest.number));
  if (typeof pullRequest.head?.sha !== 'string' || !GIT_SHA_PATTERN.test(pullRequest.head.sha)) {
    throw new Error('Automation pull request head SHA is invalid.');
  }
  writeGitHubOutput('head_sha', pullRequest.head.sha);
  writeGitHubOutput('head_branch', headBranch);
}

async function dispatchPullRequestChecks() {
  // GITHUB_TOKENが作成したPRのworkflow承認待ちに依存せず、固定branchのhead SHAを明示検証します。
  const kind = requireEnvironmentValue('AUTOMATION_KIND');
  const pullRequestNumber = parsePositiveInteger(
    requireEnvironmentValue('PULL_REQUEST_NUMBER'),
    'PULL_REQUEST_NUMBER'
  );
  const headSha = requireGitSha('PULL_REQUEST_HEAD_SHA');
  const headBranch = requireEnvironmentValue('PULL_REQUEST_HEAD_BRANCH');
  const expectedBranch = kind === 'release' ? RELEASE_BRANCH : kind === 'sync' ? SYNC_BRANCH : '';
  if (headBranch !== expectedBranch) {
    throw new Error(`Unexpected automation branch for ${kind}: ${headBranch}`);
  }

  const inputs = {
    automation_kind: kind,
    expected_sha: headSha,
    pull_request_number: String(pullRequestNumber),
  };
  await dispatchWorkflow('ci.yml', headBranch, inputs);
  await dispatchWorkflow('validate-pr-template.yml', headBranch, inputs);
  if (kind === 'sync') {
    await dispatchWorkflow('changeset-check.yml', headBranch, inputs);
  }
}

async function dispatchDeploy() {
  // GITHUB_TOKENで作成したtagはpush workflowを再発火しないため、Deployを明示dispatchします。
  const tag = requireEnvironmentValue('RELEASE_TAG');
  const repositoryMetadata = await githubRequest(`/repos/${repository}`);
  const defaultBranch = repositoryMetadata.default_branch;
  if (typeof defaultBranch !== 'string' || defaultBranch.trim() === '') {
    throw new Error('Repository default branch is unavailable.');
  }
  await dispatchWorkflow('deploy.yml', defaultBranch, { tag });
}

async function dispatchWorkflow(workflowFile, reference, inputs) {
  // workflow_dispatchはGITHUB_TOKENでも必ず実行されるGitHub標準eventなので、外部tokenを必要としません。
  await githubRequest(`/repos/${repository}/actions/workflows/${workflowFile}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: reference, inputs }),
  });
}

async function completeSyncPullRequest() {
  // 同期branchの固定checkが全て同じSHAで成功した場合だけ、merge commitとbranch削除を完了します。
  const expectedHeadSha = requireGitSha('SYNC_HEAD_SHA');
  const pullRequest = await findOpenPullRequest('develop', SYNC_BRANCH);
  if (pullRequest === undefined) {
    process.stdout.write('Synchronization pull request is already closed.\n');
    return;
  }
  if (
    pullRequest.head?.repo?.full_name !== repository ||
    pullRequest.head?.sha !== expectedHeadSha
  ) {
    throw new Error('Synchronization pull request head does not match the verified SHA.');
  }

  const successfulChecks = await listSuccessfulGitHubActionsChecks(expectedHeadSha);
  const missingChecks = AUTOMATION_CHECKS.filter((checkName) => !successfulChecks.has(checkName));
  if (missingChecks.length > 0) {
    process.stdout.write(`Synchronization is waiting for checks: ${missingChecks.join(', ')}.\n`);
    return;
  }

  const mergeResult = await githubRequest(
    `/repos/${repository}/pulls/${pullRequest.number}/merge`,
    {
      method: 'PUT',
      body: JSON.stringify({
        sha: expectedHeadSha,
        merge_method: 'merge',
        commit_title: 'chore(release): sync main into develop',
        commit_message: '検証済みのリリースメタデータをdevelopへ同期します。',
      }),
    }
  );
  if (mergeResult.merged !== true) {
    throw new Error(`Synchronization pull request was not merged: ${mergeResult.message ?? ''}`);
  }
  deleteBranchWithLease(SYNC_BRANCH, expectedHeadSha);
}

async function listSuccessfulGitHubActionsChecks(reference) {
  // 同名の承認待ちrunが存在しても、明示dispatchされた成功checkが1件あれば契約を満たします。
  const successfulChecks = new Set();
  for (let page = 1; ; page += 1) {
    const payload = await githubRequest(
      `/repos/${repository}/commits/${reference}/check-runs?per_page=100&page=${page}`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!Array.isArray(payload.check_runs)) {
      throw new TypeError('GitHub check runs response must contain an array.');
    }
    for (const checkRun of payload.check_runs) {
      if (
        checkRun.app?.slug === 'github-actions' &&
        checkRun.status === 'completed' &&
        checkRun.conclusion === 'success' &&
        typeof checkRun.name === 'string'
      ) {
        successfulChecks.add(checkRun.name);
      }
    }
    if (payload.check_runs.length < 100) {
      return successfulChecks;
    }
  }
}

async function commentPullRequest() {
  // 同期またはrelease取り込み失敗を対象PRへ記録し、workflowログを探さなくても停止理由を確認可能にします。
  const pullRequestNumber = Number.parseInt(requireEnvironmentValue('PULL_REQUEST_NUMBER'), 10);
  const body = requireEnvironmentValue('COMMENT_BODY');
  if (!Number.isSafeInteger(pullRequestNumber) || pullRequestNumber <= 0) {
    throw new Error('PULL_REQUEST_NUMBER must be a positive integer.');
  }
  await githubRequest(`/repos/${repository}/issues/${pullRequestNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

async function publishRelease() {
  // 検証済みSHAへ軽量tagを作り、同じversionを別commitへ付け替える操作を拒否します。
  const targetSha = requireEnvironmentValue('RELEASE_SHA');
  const releasePlan = parseReleasePlan(JSON.parse(readFileSync(RELEASE_PLAN_PATH, 'utf8')));
  const tagName = `v${releasePlan.version}`;
  const encodedTag = encodeURIComponent(tagName);
  const existingReference = await githubRequest(
    `/repos/${repository}/git/ref/tags/${encodedTag}`,
    undefined,
    [404]
  );
  if (existingReference === undefined) {
    await githubRequest(`/repos/${repository}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/tags/${tagName}`, sha: targetSha }),
    });
  } else if (existingReference.object?.sha !== targetSha) {
    throw new Error(`${tagName} already points to a different commit.`);
  }

  // root CHANGELOGの該当sectionをGitHub Release本文にし、package別の内部情報を利用者向けに集約します。
  const notes = extractReleaseNotes(readFileSync('CHANGELOG.md', 'utf8'), releasePlan.version);
  const existingRelease = await githubRequest(
    `/repos/${repository}/releases/tags/${encodedTag}`,
    undefined,
    [404]
  );
  if (existingRelease === undefined) {
    await githubRequest(`/repos/${repository}/releases`, {
      method: 'POST',
      body: JSON.stringify({
        tag_name: tagName,
        target_commitish: targetSha,
        name: tagName,
        body: notes,
        draft: false,
        prerelease: false,
      }),
    });
  }
  writeGitHubOutput('tag', tagName);
}

async function detectReleaseCommit() {
  // mainの任意更新を本番リリースにせず、releaseからmainへmergeされたcommitだけを識別します。
  const targetSha = requireEnvironmentValue('RELEASE_SHA');
  const pullRequests = await githubRequest(`/repos/${repository}/commits/${targetSha}/pulls`);
  if (!Array.isArray(pullRequests)) {
    throw new TypeError('GitHub associated pull requests response must be an array.');
  }
  const releasePullRequest = pullRequests.find(
    (pullRequest) =>
      pullRequest.merged_at !== null &&
      pullRequest.base?.ref === 'main' &&
      pullRequest.head?.ref === RELEASE_BRANCH &&
      pullRequest.head?.repo?.full_name === repository
  );
  writeGitHubOutput('is_release', String(releasePullRequest !== undefined));
  if (releasePullRequest !== undefined) {
    writeGitHubOutput('pull_request_number', String(releasePullRequest.number));
  }
}

function deleteMergedBranch() {
  // eventを再検証し、workflow条件が変更されても固定のmerge済みbranch以外を削除しません。
  const event = JSON.parse(readFileSync(requireEnvironmentValue('GITHUB_EVENT_PATH'), 'utf8'));
  const branch = getMergedAutomationBranch(event.pull_request, repository);
  if (branch === undefined) {
    throw new Error('Pull request is not a merged release automation branch.');
  }
  const expectedHeadSha = event.pull_request?.head?.sha;
  if (typeof expectedHeadSha !== 'string' || !GIT_SHA_PATTERN.test(expectedHeadSha)) {
    throw new Error('Merged pull request head SHA must be a 40-character hexadecimal value.');
  }

  deleteBranchWithLease(branch, expectedHeadSha);
}

function deleteBranchWithLease(branch, expectedHeadSha) {
  // merge時のhead SHAをleaseにし、同名branchが再作成済みなら新しいheadを原子的に保護します。
  const deletion = spawnSync(
    'git',
    [
      'push',
      `--force-with-lease=refs/heads/${branch}:${expectedHeadSha}`,
      'origin',
      `:refs/heads/${branch}`,
    ],
    { encoding: 'utf8' }
  );
  if (deletion.status === 0) {
    process.stdout.write(`Deleted merged automation branch ${branch}.\n`);
    return;
  }

  // 削除失敗後のremote状態を確認し、削除済みまたは再利用済みなら安全な完了として扱います。
  const lookup = spawnSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch], {
    encoding: 'utf8',
  });
  if (lookup.status === 2) {
    process.stdout.write(`Merged automation branch ${branch} was already absent.\n`);
    return;
  }
  if (lookup.status === 0) {
    const [currentHeadSha] = lookup.stdout.trim().split(/\s+/);
    if (GIT_SHA_PATTERN.test(currentHeadSha) && currentHeadSha !== expectedHeadSha) {
      process.stdout.write(`Preserved reused automation branch ${branch}.\n`);
      return;
    }
  }
  const errorMessage = typeof deletion.stderr === 'string' ? deletion.stderr.trim() : '';
  throw new Error(`Could not delete merged automation branch ${branch}: ${errorMessage}`);
}

async function githubRequest(pathname, options = undefined, allowedStatuses = []) {
  // REST APIの認証、version、JSON処理を一箇所へ集約し、全書き込みで同じ安全境界を使います。
  const response = await globalThis.fetch(`https://api.github.com${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'cfreact-template-release-automation',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options?.headers,
    },
  });
  if (allowedStatuses.includes(response.status)) {
    return undefined;
  }
  if (response.status === 204) {
    return undefined;
  }
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}: ${payload.message}`);
  }
  return payload;
}

function parsePositiveInteger(value, name) {
  // GitHub APIのresource番号を安全な正整数へ限定し、別形式のpath注入を防ぎます。
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || String(parsed) !== value) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function requireGitSha(name) {
  // branch更新とworkflow検証は完全SHAへ固定し、移動可能なrefを信頼境界に使用しません。
  const value = requireEnvironmentValue(name);
  if (!GIT_SHA_PATTERN.test(value)) {
    throw new Error(`${name} must be a 40-character hexadecimal Git SHA.`);
  }
  return value;
}

function requireEnvironmentValue(name) {
  // 必須値を利用前に検証し、空tokenや空SHAによる意図しないAPI要求を防ぎます。
  let value;
  if (name === 'AUTOMATION_KIND') value = process.env.AUTOMATION_KIND;
  if (name === 'COMMENT_BODY') value = process.env.COMMENT_BODY;
  if (name === 'GITHUB_EVENT_PATH') value = process.env.GITHUB_EVENT_PATH;
  if (name === 'GITHUB_REPOSITORY') value = process.env.GITHUB_REPOSITORY;
  if (name === 'GITHUB_TOKEN') value = process.env.GITHUB_TOKEN;
  if (name === 'PULL_REQUEST_NUMBER') value = process.env.PULL_REQUEST_NUMBER;
  if (name === 'PULL_REQUEST_HEAD_BRANCH') value = process.env.PULL_REQUEST_HEAD_BRANCH;
  if (name === 'PULL_REQUEST_HEAD_SHA') value = process.env.PULL_REQUEST_HEAD_SHA;
  if (name === 'RELEASE_SHA') value = process.env.RELEASE_SHA;
  if (name === 'RELEASE_TAG') value = process.env.RELEASE_TAG;
  if (name === 'SYNC_HEAD_SHA') value = process.env.SYNC_HEAD_SHA;
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function writeGitHubOutput(name, value) {
  // workflow step間だけで結果を共有し、repositoryへ実行時stateを保存しません。
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath === undefined || outputPath.trim() === '') {
    return;
  }
  writeFileSync(outputPath, `${name}=${value}\n`, { flag: 'a' });
}
