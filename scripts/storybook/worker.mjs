import process from 'node:process';
import { pathToFileURL } from 'node:url';

// Storybook 10の管理チャンネルはルート固定なので、標準の接続トークンで中継先を識別する。
globalThis.STORYBOOK_WEBSOCKET_TOKEN = process.env.STORYBOOK_HOST_WS_TOKEN;
delete process.env.STORYBOOK_HOST_WS_TOKEN;
const [entry, ...args] = process.argv.slice(2);
process.argv = [process.execPath, entry, ...args];
await import(pathToFileURL(entry));
