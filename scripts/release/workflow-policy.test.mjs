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

test('書き込みworkflowはrepository固有tokenと安全なrelease境界を維持する', () => {
  // 外部identityを使わず、明示dispatch、merge commit、force-with-leaseを固定します。
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
  const completeSyncWorkflow = readFileSync(
    path.join(WORKFLOW_DIRECTORY, 'complete-sync.yml'),
    'utf8'
  );
  const githubAutomation = readFileSync(GITHUB_AUTOMATION_PATH, 'utf8');
  assert.doesNotMatch(releaseWorkflow, /wrangler deploy/);
  assert.doesNotMatch(deployWorkflow, /\bpush:/);
  assert.match(deployWorkflow, /workflow_dispatch:/);
  assert.match(deployWorkflow, /environment: production/);
  assert.match(deployWorkflow, /configured == 'true'/);
  assert.match(deployWorkflow, /merge-base --is-ancestor HEAD origin\/main/);
  assert.match(releaseWorkflow, /GITHUB_TOKEN: \${{ github\.token }}/);
  assert.match(releaseWorkflow, /pnpm release:github publish-release/);
  assert.match(releaseWorkflow, /pnpm release:github dispatch-deploy/);
  assert.match(releaseWorkflow, /pnpm release:github dispatch-pr-checks/);
  assert.match(prepareWorkflow, /pnpm release:github dispatch-pr-checks/);
  assert.match(completeSyncWorkflow, /complete-sync-pr/);
  assert.match(completeSyncWorkflow, /workflow_dispatch/);
  assert.match(githubAutomation, /merge_method: 'merge'/);
  assert.match(githubAutomation, /actions\/workflows\/\${workflowFile}\/dispatches/);
  assert.match(cleanupWorkflow, /merged == true/);
  assert.match(cleanupWorkflow, /head\.repo\.full_name == github\.repository/);
  assert.match(cleanupWorkflow, /head\.ref == 'release'/);
  assert.match(cleanupWorkflow, /head\.ref == 'sync\/main-to-develop'/);
  assert.match(cleanupWorkflow, /github\.event\.pull_request\.merge_commit_sha/);
  assert.match(cleanupWorkflow, /contents: write/);
  assert.equal(cleanupWorkflow.includes('token: ${{ github.token }}'), true);
  assert.match(cleanupWorkflow, /delete-merged-branch/);
  assert.equal(
    githubAutomation.includes('--force-with-lease=refs/heads/${branch}:${expectedHeadSha}'),
    true
  );
  assert.match(githubAutomation, /ls-remote/);
  assert.match(releaseWorkflow, /upsert-sync-pr/);
  assert.match(releaseWorkflow, /git push --force-with-lease/);
  assert.match(prepareWorkflow, /git push --force-with-lease/);
  const writeWorkflows = `${releaseWorkflow}\n${prepareWorkflow}\n${deployWorkflow}\n${cleanupWorkflow}\n${completeSyncWorkflow}`;
  assert.doesNotMatch(writeWorkflows, /git push --force(?!-with-lease)/);
  assert.doesNotMatch(writeWorkflows, /pull_request_target:/);
  assert.doesNotMatch(writeWorkflows, /create-github-app-token/);
  assert.doesNotMatch(writeWorkflows, /RELEASE_APP_(?:CLIENT_ID|PRIVATE_KEY)/);
});
