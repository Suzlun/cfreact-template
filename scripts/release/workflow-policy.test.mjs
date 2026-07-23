import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const WORKFLOW_DIRECTORY = path.resolve(import.meta.dirname, '../../.github/workflows');
const GITHUB_AUTOMATION_PATH = path.resolve(import.meta.dirname, 'github-automation.mjs');

test('GitHub Actionsをimmutable commit SHAへ固定する', () => {
  // tagの移動によるsupply-chain改変を防ぐため、全workflowの外部Action参照を40桁SHAで検証します。
  const violations = [];
  for (const fileName of readdirSync(WORKFLOW_DIRECTORY).filter((name) => name.endsWith('.yml'))) {
    const workflow = readFileSync(path.join(WORKFLOW_DIRECTORY, fileName), 'utf8');
    for (const match of workflow.matchAll(/^\s*uses:\s*[^\s@]+@([^\s#]+)/gm)) {
      if (!/^[\da-f]{40}$/.test(match[1])) {
        violations.push(`${fileName}: ${match[0].trim()}`);
      }
    }
  }
  assert.deepEqual(violations, []);
});

test('書き込みworkflowは安全なreleaseと同期の境界を維持する', () => {
  // releaseとdeployの分離、production環境、merge commit、force-with-leaseを固定します。
  const releaseWorkflow = readFileSync(path.join(WORKFLOW_DIRECTORY, 'release.yml'), 'utf8');
  const deployWorkflow = readFileSync(path.join(WORKFLOW_DIRECTORY, 'deploy.yml'), 'utf8');
  const cleanupWorkflow = readFileSync(
    path.join(WORKFLOW_DIRECTORY, 'cleanup-release-branches.yml'),
    'utf8'
  );
  const prepareWorkflow = readFileSync(
    path.join(WORKFLOW_DIRECTORY, 'prepare-release.yml'),
    'utf8'
  );
  const githubAutomation = readFileSync(GITHUB_AUTOMATION_PATH, 'utf8');
  assert.doesNotMatch(releaseWorkflow, /wrangler deploy/);
  assert.match(deployWorkflow, /tags:\n\s+- 'v\*\.\*\.\*'/);
  assert.match(deployWorkflow, /environment: production/);
  assert.match(deployWorkflow, /configured == 'true'/);
  assert.match(deployWorkflow, /merge-base --is-ancestor HEAD origin\/main/);
  assert.equal(
    releaseWorkflow.includes('GITHUB_TOKEN: ${{ steps.app-token.outputs.token }}'),
    true
  );
  assert.match(releaseWorkflow, /pnpm release:github publish-release/);
  assert.match(githubAutomation, /mergeMethod: MERGE/);
  assert.match(cleanupWorkflow, /merged == true/);
  assert.match(cleanupWorkflow, /head\.repo\.full_name == github\.repository/);
  assert.match(cleanupWorkflow, /head\.ref == 'release'/);
  assert.match(cleanupWorkflow, /head\.ref == 'sync\/main-to-develop'/);
  assert.match(cleanupWorkflow, /github\.event\.pull_request\.merge_commit_sha/);
  assert.match(cleanupWorkflow, /permission-contents: write/);
  assert.equal(cleanupWorkflow.includes('token: ${{ steps.app-token.outputs.token }}'), true);
  assert.match(cleanupWorkflow, /delete-merged-branch/);
  assert.equal(
    githubAutomation.includes('--force-with-lease=refs/heads/${branch}:${expectedHeadSha}'),
    true
  );
  assert.match(githubAutomation, /ls-remote/);
  assert.match(releaseWorkflow, /upsert-sync-pr/);
  assert.match(releaseWorkflow, /git push --force-with-lease/);
  assert.match(prepareWorkflow, /git push --force-with-lease/);
  const writeWorkflows = `${releaseWorkflow}\n${prepareWorkflow}\n${deployWorkflow}\n${cleanupWorkflow}`;
  assert.doesNotMatch(writeWorkflows, /git push --force(?!-with-lease)/);
  assert.doesNotMatch(writeWorkflows, /pull_request_target:/);
});
