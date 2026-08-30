import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { resolveDeployTargets } from './release-model.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const arguments_ = process.argv.slice(2);
const option = (name, fallback) => {
  const index = arguments_.indexOf(name);
  return index === -1 ? fallback : arguments_[index + 1];
};
const requestedTargets = option('--targets', 'all');
const environment = option('--environment', 'production');
const secretsFile = option('--secrets-file', undefined);
if (requestedTargets === undefined || environment === undefined) {
  throw new Error('--targets and --environment require values.');
}
if (
  arguments_.includes('--secrets-file') &&
  (secretsFile === undefined || secretsFile.startsWith('--'))
) {
  throw new Error('--secrets-file requires a value.');
}
const dryRun = arguments_.includes('--dry-run');
const manifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, '.release/deploy-targets.json'), 'utf8')
);

for (const target of resolveDeployTargets(manifest, requestedTargets)) {
  const commandArguments = [
    '--filter',
    target.workspace,
    'exec',
    'wrangler',
    'deploy',
    '--config',
    path.join(repositoryRoot, target.renderedConfig),
    '--env',
    environment,
    ...(secretsFile === undefined
      ? []
      : ['--secrets-file', path.resolve(repositoryRoot, secretsFile)]),
    ...(dryRun ? ['--dry-run'] : []),
  ];
  const result = spawnSync('pnpm', commandArguments, {
    cwd: repositoryRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`Deploy target failed: ${target.name}`);
  }
}
