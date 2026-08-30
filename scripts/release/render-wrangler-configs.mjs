import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { resolveDeployTargets } from './release-model.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const arguments_ = process.argv.slice(2);
const readOption = (name) => {
  const index = arguments_.indexOf(name);
  const value = index === -1 ? undefined : arguments_[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${name} is required.`);
  }
  return value;
};

const outputsPath = path.resolve(repositoryRoot, readOption('--terraform-outputs'));
const manifest = JSON.parse(
  await readFile(path.join(repositoryRoot, '.release/deploy-targets.json'), 'utf8')
);
const outputs = JSON.parse(await readFile(outputsPath, 'utf8'));
const outputMap = new Map(Object.entries(outputs));
const outputValue = (name) => {
  const value = outputMap.get(name)?.value;
  if (typeof value !== 'string' || value === '') {
    throw new Error(`Terraform output ${name} must be a non-empty string.`);
  }
  return value;
};
const replaceRequired = (source, searchValue, replacement) => {
  if (!source.includes(searchValue)) {
    throw new Error(`Wrangler template does not contain ${searchValue}.`);
  }
  return source.replaceAll(searchValue, replacement);
};

const replacements = new Map([
  [
    'core',
    [
      ['YOUR_DATABASE_ID_HERE', outputValue('core_database_id')],
      ['YOUR_PRODUCTION_DATABASE_ID_HERE', outputValue('core_database_id')],
      ['cfreact-template-db-production', outputValue('core_database_name')],
    ],
  ],
  [
    'main',
    [
      ['YOUR_KV_NAMESPACE_ID_HERE', outputValue('main_kv_namespace_id')],
      ['YOUR_PRODUCTION_KV_NAMESPACE_ID_HERE', outputValue('main_kv_namespace_id')],
      ['cfreact-template-bucket-production', outputValue('main_r2_bucket_name')],
    ],
  ],
]);

for (const target of resolveDeployTargets(manifest, 'all')) {
  const { name } = target;
  let config = await readFile(path.join(repositoryRoot, target.wranglerConfig), 'utf8');
  for (const [searchValue, replacement] of replacements.get(name) ?? []) {
    config = replaceRequired(config, searchValue, replacement);
  }
  await writeFile(path.join(repositoryRoot, target.renderedConfig), config);
}
