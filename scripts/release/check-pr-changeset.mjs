import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import process from 'node:process';

import {
  isAddedChangesetFile,
  isTrustedSyncPullRequest,
  requiresApplicationChangeset,
  validateChangesetMarkdown,
} from './release-model.mjs';

const repository = requireEnvironmentValue('GITHUB_REPOSITORY');
const token = requireEnvironmentValue('GITHUB_TOKEN');
const pullRequest = await readPullRequest(repository, token);

// 明示dispatchではbranch移動後の古い検査を成功させないよう、対象headを完全SHAで固定します。
const expectedSha = process.env.EXPECTED_SHA;
if (expectedSha !== undefined && expectedSha !== '' && pullRequest.head?.sha !== expectedSha) {
  throw new Error('Pull request head SHA does not match EXPECTED_SHA.');
}

// mainからdevelopへの信頼済み同期PRはrelease metadataの反映なので、追加Changesetを要求しません。
if (isTrustedSyncPullRequest(pullRequest, repository)) {
  process.stdout.write(
    'Trusted main-to-develop synchronization PR does not require a Changeset.\n'
  );
} else {
  // GitHub APIから全変更ファイルを取得し、forkのコードやscriptを実行せずChangeset追加だけを検査します。
  const files = await listPullRequestFiles(repository, pullRequest.number, token);
  const releaseFiles = files.filter((file) => requiresApplicationChangeset(file.filename));
  if (releaseFiles.length === 0) {
    process.stdout.write('Pull request does not change application release files.\n');
  } else {
    const addedChangesets = files.filter(isAddedChangesetFile);
    if (addedChangesets.length === 0) {
      throw new Error(
        'Application release file changes require a .changeset/*.md file. Use `pnpm changeset --empty` when no version bump is required.'
      );
    }
    for (const changeset of addedChangesets) {
      // PR headのblobをデータとして読み、Changesets CLI互換のfront matterであることを確認します。
      const markdown = await readRepositoryFile(
        repository,
        changeset.filename,
        pullRequest.head.sha,
        token
      );
      validateChangesetMarkdown(markdown);
    }
    process.stdout.write('Pull request contains a newly added Changeset.\n');
  }
}

async function readPullRequest(repositoryName, githubToken) {
  // 通常PR eventではpayloadを使い、GITHUB_TOKEN作成PRではworkflow_dispatch入力からAPIで取得します。
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath !== undefined && eventPath.trim() !== '') {
    const event = JSON.parse(readFileSync(eventPath, 'utf8'));
    if (typeof event.pull_request === 'object' && event.pull_request !== null) {
      return event.pull_request;
    }
  }

  const pullRequestNumber = Number.parseInt(process.env.PULL_REQUEST_NUMBER ?? '', 10);
  if (!Number.isSafeInteger(pullRequestNumber) || pullRequestNumber <= 0) {
    throw new Error('PULL_REQUEST_NUMBER must identify a pull request for workflow_dispatch.');
  }
  const pullRequest = await githubRequest(
    `/repos/${repositoryName}/pulls/${pullRequestNumber}`,
    githubToken
  );
  if (typeof pullRequest !== 'object' || pullRequest === null || Array.isArray(pullRequest)) {
    throw new TypeError('GitHub pull request response must be an object.');
  }
  return pullRequest;
}

async function listPullRequestFiles(repositoryName, pullRequestNumber, githubToken) {
  // GitHubの100件上限を越えるPRでも判定が欠落しないよう、空pageまで順に取得します。
  const files = [];
  for (let page = 1; ; page += 1) {
    const response = await githubRequest(
      `/repos/${repositoryName}/pulls/${pullRequestNumber}/files?per_page=100&page=${page}`,
      githubToken
    );
    if (!Array.isArray(response)) {
      throw new TypeError('GitHub pull request files response must be an array.');
    }
    files.push(...response);
    if (response.length < 100) {
      return files;
    }
  }
}

async function githubRequest(pathname, githubToken) {
  // tokenはAuthorization headerだけへ渡し、URL、本文、例外messageへ含めません。
  const response = await globalThis.fetch(`https://api.github.com${pathname}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'User-Agent': 'cfreact-template-changeset-check',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}.`);
  }
  return payload;
}

async function readRepositoryFile(repositoryName, filePath, reference, githubToken) {
  // path segmentを個別にencodeし、branch内容をGitHub Contents APIから安全に取得します。
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const query = new globalThis.URLSearchParams({ ref: reference });
  const payload = await githubRequest(
    `/repos/${repositoryName}/contents/${encodedPath}?${query.toString()}`,
    githubToken
  );
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload) ||
    payload.encoding !== 'base64' ||
    typeof payload.content !== 'string'
  ) {
    throw new TypeError(`GitHub contents response is invalid for ${filePath}.`);
  }
  return Buffer.from(payload.content.replaceAll('\n', ''), 'base64').toString('utf8');
}

function requireEnvironmentValue(name) {
  // workflow契約に必要な値を処理開始前に検証し、部分的な検査結果を返しません。
  let value;
  if (name === 'GITHUB_REPOSITORY') value = process.env.GITHUB_REPOSITORY;
  if (name === 'GITHUB_TOKEN') value = process.env.GITHUB_TOKEN;
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
