import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

// 端末全体のOpenSpec設定に左右されず、採用した手順の公式スキルとコマンドを生成する。
const isolatedConfigHome = mkdtempSync(path.join(tmpdir(), 'cfreact-template-openspec-'));
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const openspecEntry = import.meta.resolve('@fission-ai/openspec');
const openspecCli = fileURLToPath(new URL('../bin/openspec.js', openspecEntry));
const isolatedOpenSpecConfig = path.join(isolatedConfigHome, 'openspec');

try {
  mkdirSync(isolatedOpenSpecConfig, { recursive: true });
  // 共通スキルとOpenCodeコマンドを、それぞれの公式出力先へ生成する。
  for (const [tool, delivery] of [
    ['agents', 'skills'],
    ['opencode', 'commands'],
  ]) {
    writeFileSync(
      path.join(isolatedOpenSpecConfig, 'config.json'),
      `${JSON.stringify(
        {
          featureFlags: {},
          profile: 'custom',
          delivery,
          workflows: ['new', 'continue', 'update', 'apply', 'verify', 'sync', 'archive'],
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    const generation = spawnSync(
      process.execPath,
      [openspecCli, 'init', '.', '--tools', tool, '--force', '--no-animation'],
      {
        cwd: repositoryRoot,
        env: { ...process.env, XDG_CONFIG_HOME: isolatedConfigHome },
        stdio: 'inherit',
      }
    );
    if (generation.error !== undefined) throw generation.error;
    if (generation.status !== 0) {
      process.exitCode = generation.status ?? 1;
      break;
    }
  }
} finally {
  // 一時設定を必ず除去し、認証情報や端末固有設定をリポジトリへ残さない。
  rmSync(isolatedConfigHome, { recursive: true, force: true });
}
