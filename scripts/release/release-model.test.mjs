import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertSingleVersion,
  changesetHasRelease,
  createPullRequestBody,
  createRootChangelog,
  extractReleaseNotes,
  getMergedAutomationBranch,
  isAddedChangesetFile,
  isTrustedSyncPullRequest,
  parseChangesetSummary,
  parseReleasePlan,
  validateChangesetMarkdown,
} from './release-model.mjs';

test('develop向けPRでは新規Changesetだけを受け付ける', () => {
  // 既存Changesetの変更やREADME追加では必須検査を回避できないことを確認します。
  assert.equal(
    isAddedChangesetFile({ status: 'added', filename: '.changeset/calm-dogs.md' }),
    true
  );
  assert.equal(
    isAddedChangesetFile({ status: 'modified', filename: '.changeset/calm-dogs.md' }),
    false
  );
  assert.equal(isAddedChangesetFile({ status: 'added', filename: '.changeset/README.md' }), false);
});

test('main同期の除外は同一repositoryの固定branchだけに限定する', () => {
  // forkが同名branchを用意してもChangeset検査を免除されないことを確認します。
  const repository = 'owner/example';
  assert.equal(
    isTrustedSyncPullRequest(
      { head: { ref: 'sync/main-to-develop', repo: { full_name: repository } } },
      repository
    ),
    true
  );
  assert.equal(
    isTrustedSyncPullRequest(
      { head: { ref: 'sync/main-to-develop', repo: { full_name: 'fork/example' } } },
      repository
    ),
    false
  );
});

test('merge済みの固定自動化branchだけをcleanup対象にする', () => {
  // releaseと同期の正規PRだけを返し、未merge、fork、別baseのbranchを削除対象から除外します。
  const repository = 'owner/example';
  assert.equal(
    getMergedAutomationBranch(
      {
        merged: true,
        base: { ref: 'main' },
        head: { ref: 'release', repo: { full_name: repository } },
      },
      repository
    ),
    'release'
  );
  assert.equal(
    getMergedAutomationBranch(
      {
        merged: true,
        base: { ref: 'develop' },
        head: { ref: 'sync/main-to-develop', repo: { full_name: repository } },
      },
      repository
    ),
    'sync/main-to-develop'
  );
  assert.equal(
    getMergedAutomationBranch(
      {
        merged: false,
        base: { ref: 'main' },
        head: { ref: 'release', repo: { full_name: repository } },
      },
      repository
    ),
    undefined
  );
  assert.equal(
    getMergedAutomationBranch(
      {
        merged: true,
        base: { ref: 'main' },
        head: { ref: 'release', repo: { full_name: 'fork/example' } },
      },
      repository
    ),
    undefined
  );
  assert.equal(
    getMergedAutomationBranch(
      {
        merged: true,
        base: { ref: 'develop' },
        head: { ref: 'release', repo: { full_name: repository } },
      },
      repository
    ),
    undefined
  );
});

test('release planは安定SemVerと許可した最低bumpだけを受け付ける', () => {
  // 手動指定の入力境界でprereleaseや未知のbumpを拒否します。
  assert.deepEqual(parseReleasePlan({ minimumBump: 'major', version: '1.2.3' }), {
    minimumBump: 'major',
    version: '1.2.3',
  });
  assert.throws(() => parseReleasePlan({ minimumBump: 'breaking', version: '1.2.3' }));
  assert.throws(() => parseReleasePlan({ minimumBump: 'auto', version: '1.2.3-next.1' }));
});

test('通常Changesetとempty Changesetを区別して説明を取得する', () => {
  // empty Changesetを明示的なversion対象外として扱い、通常Changesetの本文を保持します。
  const normal = '---\n"pkg-a": minor\n---\n\n顧客向け機能を追加しました。\n';
  const empty = '---\n---\n';
  assert.equal(changesetHasRelease(normal), true);
  assert.equal(changesetHasRelease(empty), false);
  assert.equal(parseChangesetSummary(normal), '顧客向け機能を追加しました。');
  assert.equal(parseChangesetSummary(empty), '');
  assert.doesNotThrow(() => validateChangesetMarkdown(normal));
  assert.doesNotThrow(() => validateChangesetMarkdown(empty));
  assert.throws(() => validateChangesetMarkdown('---\n"pkg-a": breaking\n---\n\n不正\n'));
});

test('全manifestとrelease planのversion不一致を拒否する', () => {
  // fixed groupの一部だけが更新された状態を本番リリースへ進めないことを確認します。
  const packages = [{ manifest: { version: '1.2.3' } }, { manifest: { version: '1.2.3' } }];
  assert.equal(assertSingleVersion({ version: '1.2.3' }, packages, { version: '1.2.3' }), '1.2.3');
  assert.throws(() => assertSingleVersion({ version: '1.2.3' }, packages, { version: '1.2.4' }));
});

test('root CHANGELOGの対象versionだけをGitHub Release本文にする', () => {
  // 新しいrelease sectionを先頭へ追加し、過去versionをRelease本文へ混入させません。
  const previous = '# example\n\n## 1.0.0\n\n- 最初のリリース\n';
  const changelog = createRootChangelog('example', '1.1.0', ['機能を追加しました。'], previous);
  assert.match(changelog, /^# example\n\n## 1\.1\.0/);
  assert.equal(extractReleaseNotes(changelog, '1.1.0'), '- 機能を追加しました。');
  assert.equal(extractReleaseNotes(changelog, '1.0.0'), '- 最初のリリース');
});

test('自動PR本文はrepository標準テンプレートの必須情報を満たす', () => {
  // releaseと同期の双方で空欄や未確認checkboxが残らないことを確認します。
  for (const kind of ['release', 'sync']) {
    const body = createPullRequestBody(kind, '1.2.3');
    assert.match(body, /## セキュリティ確認/);
    assert.match(body, /## リリース影響/);
    assert.doesNotMatch(body, /- \[ ]/);
    assert.doesNotMatch(body, /^- [^:]+:\s*$/m);
  }
});
