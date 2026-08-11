import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';

const WORKFLOW_DIRECTORY = path.resolve(import.meta.dirname, '../../.github/workflows');
const GITHUB_AUTOMATION_PATH = path.resolve(import.meta.dirname, 'github-automation.mjs');
const PR_TEMPLATE_PATH = path.resolve(
  import.meta.dirname,
  '../../.github/pull_request_template.md'
);
const PR_VALIDATOR_PATH = path.join(WORKFLOW_DIRECTORY, 'validate-pr-template.yml');

/**
 * ワークフローの `run: |` から、実運用と同じプルリクエスト本文検証コマンドを取得します。
 *
 * @returns {string} Bash で実行できる Node.js 検証コマンド。
 */
function getPrValidatorCommand() {
  // 試験用の別実装を作らず、GitHub Actions が実際に実行する埋め込み処理を検証対象にします。
  const workflow = readFileSync(PR_VALIDATOR_PATH, 'utf8');
  const match = / {8}run: \|\n([\s\S]+)$/u.exec(workflow);
  assert.ok(match?.[1], 'validate-pr-template.yml に検証コマンドが必要です。');
  return match[1].replace(/^ {10}/gmu, '');
}

/**
 * 標準雛形の全必須項目を埋めた試験用プルリクエスト本文を生成します。
 *
 * @param {Record<string, string>} [overrides] - 項目名ごとに上書きする値。
 * @param {boolean} [includeImages] - 四つの必須画像欄へ画像を追加するか。
 * @returns {string} 検証へ渡す完成済み本文。
 */
function createPrBody(overrides = {}, includeImages = false) {
  const values = new Map(
    Object.entries({
      'Operation Lane': 'DIRECT',
      'UX Mode': 'NONE',
      'Review Depth': 'STANDARD',
      'OpenSpec Change': 'なし（理由: 振る舞い契約を変更しないため）',
      'Scenario IDs': 'なし（理由: 振る舞い契約を変更しないため）',
      'UI / UX変更': 'なし',
      ...overrides,
    })
  );

  // 雛形の空欄をすべて埋め、未確認チェックボックスも確認済みへ変換します。
  let body = readFileSync(PR_TEMPLATE_PATH, 'utf8')
    .replace(
      /^- ([^:\n]+):\s*$/gmu,
      (_line, label) => `- ${label}: ${values.get(label) ?? '確認済み'}`
    )
    .replaceAll('- [ ]', '- [x]');

  // UI 変更の成功例だけ、実際の検証が認識する Markdown 画像を四つの欄へ個別に置きます。
  if (includeImages) {
    for (const heading of [
      '#### Desktop Before',
      '#### Desktop After',
      '#### Mobile Before',
      '#### Mobile After',
    ]) {
      body = body.replace(heading, `${heading}\n\n![確認画像](https://example.com/evidence.png)`);
    }
  }
  return body;
}

/**
 * プルリクエスト本文を、ワークフローに埋め込まれた検証処理へ渡します。
 *
 * @param {string} body - 検証対象のプルリクエスト本文。
 * @returns {import('node:child_process').SpawnSyncReturns<string>} 終了状態と標準出力・標準エラー。
 */
function runPrValidator(body) {
  // 通常の pull_request イベントと同じく PR_BODY から本文を読み、外部 API へ接続しません。
  return spawnSync('bash', ['-c', getPrValidatorCommand()], {
    env: { ...process.env, PR_BODY: body, PR_NUMBER: '' },
    encoding: 'utf8',
  });
}

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
  const ciWorkflow = readFileSync(path.join(WORKFLOW_DIRECTORY, 'ci.yml'), 'utf8');
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
  // mainでは同じCIを再実行せず、main更新からrelease処理を直接開始します。
  assert.doesNotMatch(ciWorkflow, /^\s{6}- main$/m);
  assert.match(releaseWorkflow, /^ {2}push:\n {4}branches:\n {6}- main$/m);
  assert.doesNotMatch(releaseWorkflow, /^ {2}workflow_run:/m);
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

test('PR本文は変更運用、OpenSpec、UI実証の契約を満たす', () => {
  // DIRECT は、OpenSpec Change と Scenario IDs に理由付きの非該当を記録できます。
  const direct = runPrValidator(createPrBody());
  assert.equal(direct.status, 0, direct.stderr);

  // 観測可能な振る舞いまたは物質的構造を変える運用区分では、OpenSpec の省略を拒否します。
  for (const operationLane of ['BEHAVIOR', 'ARCHITECTURE']) {
    const missingOpenSpec = runPrValidator(createPrBody({ 'Operation Lane': operationLane }));
    assert.equal(missingOpenSpec.status, 1);
    assert.match(missingOpenSpec.stderr, /OpenSpec Change/u);
    assert.match(missingOpenSpec.stderr, /Scenario IDs/u);
  }

  // Scenario ID は OpenSpec の追跡検査と同じ安定識別子形式だけを受け付けます。
  const invalidScenario = runPrValidator(
    createPrBody({
      'Operation Lane': 'BEHAVIOR',
      'OpenSpec Change': 'shape-dashboard',
      'Scenario IDs': 'dashboard-1',
    })
  );
  assert.equal(invalidScenario.status, 1);
  assert.match(invalidScenario.stderr, /USER-MGMT-S001/u);

  // UI 変更はプロダクトデザイナーと実ブラウザの確認に加え、四つの画像が揃う場合だけ成功します。
  const uiFields = {
    'Operation Lane': 'BEHAVIOR',
    'UX Mode': 'SHAPE',
    'OpenSpec Change': 'shape-dashboard',
    'Scenario IDs': 'DASHBOARD-S001, DASHBOARD-S002',
    'UI / UX変更': 'あり',
    デスクトップ確認: '実ブラウザで確認済み',
    モバイル確認: '実ブラウザで確認済み',
    アクセシビリティ確認: '実ブラウザで確認済み',
    プロダクトデザイナー確認: '実ブラウザで確認済み',
  };
  const uiWithImages = runPrValidator(createPrBody(uiFields, true));
  assert.equal(uiWithImages.status, 0, uiWithImages.stderr);

  // 既存の変更前後画像要件を維持し、いずれか一つでも欠ける本文を拒否します。
  const uiWithoutImages = runPrValidator(createPrBody(uiFields));
  assert.equal(uiWithoutImages.status, 1);
  assert.match(uiWithoutImages.stderr, /Desktop Before/u);
  assert.match(uiWithoutImages.stderr, /Mobile After/u);
});
