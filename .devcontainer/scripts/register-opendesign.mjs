import process from 'node:process';

// ComposeがAIサービスの正常起動を確認した後、選択中のワークスペースだけを登録する。
const origin = 'http://127.0.0.1:7456';
const baseDir = process.cwd();
const response = await globalThis.fetch(`${origin}/api/projects`);
if (!response.ok) {
  throw new Error(`OpenDesign のプロジェクト一覧取得に失敗しました: HTTP ${response.status}`);
}
const { projects } = await response.json();

if (projects.some((project) => project.metadata?.baseDir === baseDir)) {
  process.stdout.write(`OpenDesign: ${baseDir} は登録済みです。\n`);
} else {
  const registered = await globalThis.fetch(`${origin}/api/import/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseDir, name: process.argv[2] }),
  });
  if (!registered.ok) {
    throw new Error(`OpenDesign のワークスペース登録に失敗しました: HTTP ${registered.status}`);
  }
  process.stdout.write(`OpenDesign: ${baseDir} を登録しました。\n`);
}
