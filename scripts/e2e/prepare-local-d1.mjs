import { spawn } from 'node:child_process';
import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

// script の位置から repository root を解決し、migration と E2E state の基準を固定する。
const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
// Drizzle が生成する SQL migration の格納先を定義する。
const migrationsDirectory = resolve(projectRoot, 'drizzle/migrations');
// 通常開発用の D1 state と混在しない、E2E 専用の永続化先を定義する。
const persistenceDirectory = resolve(projectRoot, '.wrangler/e2e-state');

/**
 * 指定した command を終了状態まで実行する。
 *
 * @param {string} command 実行する command 名。
 * @param {string[]} arguments_ command に渡す引数。
 * @returns {Promise<void>} command が正常終了した時点で解決される Promise。
 * @throws command の起動または終了に失敗した場合に reject する。
 */
const runCommand = async (command, arguments_) =>
  new Promise((resolveCommand, rejectCommand) => {
    // migration の実行ログを Playwright の起動ログに出力し、失敗箇所を追跡可能にする。
    const child = spawn(command, arguments_, {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    // OS が command を起動できない場合は、E2E を継続せずに原因を返す。
    child.on('error', rejectCommand);
    // 非ゼロ終了は schema が完全ではない状態を表すため、E2E 開始前に失敗させる。
    child.on('exit', (code) => {
      if (code === 0) {
        resolveCommand();
        return;
      }

      rejectCommand(new Error(`${command} exited with code ${String(code)}.`));
    });
  });

// top-level SQL migration を名前順で取得し、適用順を安定させる。
const migrations = (await readdir(migrationsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
  .map((entry) => resolve(migrationsDirectory, entry.name))
  .sort();

// migration が存在しない構成では DB schema を保証できないため、起動前に明示的に停止する。
if (migrations.length === 0) {
  throw new Error(`No SQL migrations found in ${migrationsDirectory}.`);
}

// 前回の E2E データを削除し、実行順や既存データに依存しない schema を作る。
await rm(persistenceDirectory, { recursive: true, force: true });

// 全 migration を同じ E2E 専用 D1 state へ順番に適用する。
for (const migration of migrations) {
  await runCommand('pnpm', [
    '--filter',
    '@cfreact-template/backend',
    'exec',
    'wrangler',
    'd1',
    'execute',
    'cfreact-template-db',
    '--cwd',
    projectRoot,
    '--local',
    '--persist-to',
    persistenceDirectory,
    '--file',
    migration,
  ]);
}
