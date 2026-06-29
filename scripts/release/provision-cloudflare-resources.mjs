import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';

const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';
const WRANGLER_CONFIG_PATH = 'wrangler.toml';
const RELEASE_WRANGLER_CONFIG_PATH = '.wrangler/release.wrangler.toml';
const DEFAULT_ENVIRONMENT = 'production';
const PLACEHOLDER_D1_DATABASE_ID = 'YOUR_DATABASE_ID_HERE';
const PLACEHOLDER_PRODUCTION_D1_DATABASE_ID = 'YOUR_PRODUCTION_DATABASE_ID_HERE';
const PLACEHOLDER_KV_NAMESPACE_ID = 'YOUR_KV_NAMESPACE_ID_HERE';
const PLACEHOLDER_PRODUCTION_KV_NAMESPACE_ID = 'YOUR_PRODUCTION_KV_NAMESPACE_ID_HERE';

const accountId = requireEnvironmentValue('CLOUDFLARE_ACCOUNT_ID');
const apiToken = requireEnvironmentValue('CLOUDFLARE_API_TOKEN');
const wranglerEnvironment = process.env.WRANGLER_ENVIRONMENT ?? DEFAULT_ENVIRONMENT;

const sourceConfig = readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
const environmentConfig = extractEnvironmentConfig(sourceConfig, wranglerEnvironment);
const d1DatabaseName = requireTomlString(environmentConfig, 'database_name', 'd1_databases');
const kvBindingName = requireTomlString(environmentConfig, 'binding', 'kv_namespaces');
const r2BucketName = requireTomlString(environmentConfig, 'bucket_name', 'r2_buckets');

const d1Database = await ensureD1Database(d1DatabaseName);
const kvNamespace = await ensureKvNamespace(`${kvBindingName}-${wranglerEnvironment}`);
const r2Bucket = await ensureR2Bucket(r2BucketName);

const releaseConfig = createReleaseWranglerConfig(sourceConfig, {
  d1DatabaseId: d1Database.uuid,
  kvNamespaceId: kvNamespace.id,
});

mkdirSync(dirname(RELEASE_WRANGLER_CONFIG_PATH), { recursive: true });
writeFileSync(RELEASE_WRANGLER_CONFIG_PATH, releaseConfig);
writeGitHubOutput('wrangler_config', RELEASE_WRANGLER_CONFIG_PATH);

process.stdout.write(
  [
    `Cloudflare resources ready for ${wranglerEnvironment}.`,
    `D1 database: ${d1Database.name}`,
    `KV namespace: ${kvNamespace.title}`,
    `R2 bucket: ${r2Bucket.name}`,
    `Wrangler config: ${RELEASE_WRANGLER_CONFIG_PATH}`,
  ].join('\n') + '\n'
);

function requireEnvironmentValue(name) {
  // 必須の認証情報は最初に検証し、途中で曖昧な Cloudflare API エラーにならないようにします。
  const value = readAllowedEnvironmentValue(name);
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readAllowedEnvironmentValue(name) {
  // 参照する環境変数名を固定し、任意キーで process.env を読む実装を避けます。
  if (name === 'CLOUDFLARE_ACCOUNT_ID') {
    return process.env.CLOUDFLARE_ACCOUNT_ID;
  }
  if (name === 'CLOUDFLARE_API_TOKEN') {
    return process.env.CLOUDFLARE_API_TOKEN;
  }
  return undefined;
}

function extractEnvironmentConfig(config, environmentName) {
  // 対象 environment の設定だけを以降の抽出対象にし、production以外にも同じ処理を使えるようにします。
  const environmentHeader = `[env.${environmentName}]`;
  const startIndex = config.indexOf(environmentHeader);
  if (startIndex === -1) {
    throw new Error(`Missing ${environmentHeader} in ${WRANGLER_CONFIG_PATH}.`);
  }
  return config.slice(startIndex);
}

function requireTomlString(config, key, tableName) {
  // Wrangler TOML の単純な string 値だけを読み、releaseに必要なbinding名とresource名を取得します。
  const scopedConfig = extractTableConfig(config, tableName);
  const value = readTomlString(scopedConfig, key);
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing ${key} in ${WRANGLER_CONFIG_PATH}.`);
  }
  return value;
}

function readTomlString(config, key) {
  // 動的正規表現を使わず、対象キーの行からquote内の値だけを取り出します。
  const prefix = `${key} = `;
  const line = config
    .split('\n')
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.startsWith(prefix));
  if (line === undefined) {
    return undefined;
  }
  const firstQuoteIndex = line.indexOf('"');
  const lastQuoteIndex = line.lastIndexOf('"');
  if (firstQuoteIndex === -1 || lastQuoteIndex <= firstQuoteIndex) {
    return undefined;
  }
  return line.slice(firstQuoteIndex + 1, lastQuoteIndex);
}

function extractTableConfig(config, tableName) {
  // 同じ environment 内の複数bindingから、指定テーブルの最初の定義だけを対象にします。
  const tableHeader = `[[env.${wranglerEnvironment}.${tableName}]]`;
  const startIndex = config.indexOf(tableHeader);
  if (startIndex === -1) {
    throw new Error(`Missing ${tableHeader} in ${WRANGLER_CONFIG_PATH}.`);
  }
  const nextTableIndex = config.indexOf('[[', startIndex + tableHeader.length);
  if (nextTableIndex === -1) {
    return config.slice(startIndex);
  }
  return config.slice(startIndex, nextTableIndex);
}

async function ensureD1Database(databaseName) {
  // D1は名前で既存databaseを検索し、2回目以降のCDで同じuuidを再利用します。
  const databases = await listCloudflareResources(`/accounts/${accountId}/d1/database`);
  const existingDatabase = databases.find((database) => database.name === databaseName);
  if (existingDatabase !== undefined) {
    return existingDatabase;
  }

  const createdDatabase = await cloudflareRequest(`/accounts/${accountId}/d1/database`, {
    method: 'POST',
    body: { name: databaseName },
  });
  return createdDatabase.result;
}

async function ensureKvNamespace(namespaceTitle) {
  // KVはbinding名とenvironment名から安定したtitleを作り、既存namespaceを再利用します。
  const namespaces = await listCloudflareResources(`/accounts/${accountId}/storage/kv/namespaces`);
  const existingNamespace = namespaces.find((namespace) => namespace.title === namespaceTitle);
  if (existingNamespace !== undefined) {
    return existingNamespace;
  }

  const createdNamespace = await cloudflareRequest(`/accounts/${accountId}/storage/kv/namespaces`, {
    method: 'POST',
    body: { title: namespaceTitle },
  });
  return createdNamespace.result;
}

async function ensureR2Bucket(bucketName) {
  // R2 bucketはbucket_nameを安定識別子として扱い、存在しない場合だけ作成します。
  const buckets = await listCloudflareResources(`/accounts/${accountId}/r2/buckets`);
  const existingBucket = buckets.find((bucket) => bucket.name === bucketName);
  if (existingBucket !== undefined) {
    return existingBucket;
  }

  await cloudflareRequest(`/accounts/${accountId}/r2/buckets/${encodeURIComponent(bucketName)}`, {
    method: 'PUT',
  });
  return { name: bucketName };
}

async function listCloudflareResources(pathname) {
  // Cloudflare APIはresourceごとにresult配列またはresult.items配列を返すため、両方を正規化します。
  const response = await cloudflareRequest(`${pathname}?per_page=100`);
  if (Array.isArray(response.result)) {
    return response.result;
  }
  if (Array.isArray(response.result?.items)) {
    return response.result.items;
  }
  return [];
}

async function cloudflareRequest(pathname, options = {}) {
  // API tokenはAuthorization headerにだけ入れ、ログや生成configへは書き込みません。
  const response = await globalThis.fetch(`${CLOUDFLARE_API_BASE_URL}${pathname}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(
      `Cloudflare API request failed: ${pathname}: ${JSON.stringify(payload.errors)}`
    );
  }
  return payload;
}

function createReleaseWranglerConfig(config, resources) {
  // 公開wrangler.tomlはそのまま残し、GitHub Actions内の直接CDだけ実ID入り一時configを使います。
  return config
    .replaceAll(PLACEHOLDER_D1_DATABASE_ID, resources.d1DatabaseId)
    .replaceAll(PLACEHOLDER_PRODUCTION_D1_DATABASE_ID, resources.d1DatabaseId)
    .replaceAll(PLACEHOLDER_KV_NAMESPACE_ID, resources.kvNamespaceId)
    .replaceAll(PLACEHOLDER_PRODUCTION_KV_NAMESPACE_ID, resources.kvNamespaceId);
}

function writeGitHubOutput(name, value) {
  // 後続のdeploy stepへ一時Wrangler configのpathを安全に渡します。
  const githubOutputPath = process.env.GITHUB_OUTPUT;
  if (githubOutputPath === undefined || githubOutputPath.trim() === '') {
    return;
  }
  writeFileSync(githubOutputPath, `${name}=${value}\n`, { flag: 'a' });
}
