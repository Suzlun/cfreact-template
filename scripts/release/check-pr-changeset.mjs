import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import process from 'node:process';

import {
  isAddedChangesetFile,
  isTrustedSyncPullRequest,
  validateChangesetMarkdown,
} from './release-model.mjs';

const eventPath = requireEnvironmentValue('GITHUB_EVENT_PATH');
const repository = requireEnvironmentValue('GITHUB_REPOSITORY');
const token = requireEnvironmentValue('GITHUB_TOKEN');
const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const pullRequest = event.pull_request;

// pull_requestイベント以外で誤実行された場合は、曖昧な成功にせず設定不備として停止します。
if (typeof pullRequest !== 'object' || pullRequest === null) {
  throw new Error('GITHUB_EVENT_PATH does not contain a pull request event.');
}

// mainからdevelopへの信頼済み同期PRはrelease metadataの反映なので、追加Changesetを要求しません。
if (isTrustedSyncPullRequest(pullRequest, repository)) {
  process.stdout.write(
    'Trusted main-to-develop synchronization PR does not require a Changeset.\n'
  );
} else {
  // GitHub APIから全変更ファイルを取得し、forkのコードやscriptを実行せずChangeset追加だけを検査します。
  const files = await listPullRequestFiles(repository, pullRequest.number, token);
  const addedChangesets = files.filter(isAddedChangesetFile);
  if (addedChangesets.length === 0) {
    throw new Error(
      'Every pull request to develop must add a .changeset/*.md file. Use `pnpm changeset --empty` when no version bump is required.'
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
  if (name === 'GITHUB_EVENT_PATH') value = process.env.GITHUB_EVENT_PATH;
  if (name === 'GITHUB_REPOSITORY') value = process.env.GITHUB_REPOSITORY;
  if (name === 'GITHUB_TOKEN') value = process.env.GITHUB_TOKEN;
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
