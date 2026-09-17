import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { parseArgs } from 'node:util';

import { createServer } from 'vite';

const { values } = parseArgs({
  options: {
    config: { type: 'string' },
    host: { type: 'string' },
    port: { type: 'string' },
  },
});
const configuration = values.config
  ? JSON.parse(await readFile(path.resolve(values.config), 'utf8'))
  : { projects: [{ id: 'workspace', title: '作業プロジェクト', directory: process.cwd() }] };
const port = Number(values.port ?? configuration.port ?? 7456);
const host = values.host ?? configuration.host ?? '127.0.0.1';
const allowedHosts = ['localhost', 'storybook', ...(configuration.allowedHosts ?? [])];
const runtimeDirectory = await mkdtemp(path.join(tmpdir(), 'storybook-host-'));
const projects = [];
const proxy = {};
let server;
let stopping = false;

async function stop() {
  if (stopping) return;
  stopping = true;
  await server?.close();
  await Promise.all(
    projects.map(async ({ child }) => {
      if (!child || child.exitCode !== null || child.signalCode !== null) return;
      const exited = new Promise((resolve) => child.once('exit', resolve));
      if (process.platform === 'win32') child.kill('SIGTERM');
      else process.kill(-child.pid, 'SIGTERM');
      await exited;
    })
  );
  await rm(runtimeDirectory, { recursive: true, force: true });
}

process.once('SIGINT', () => void stop());
process.once('SIGTERM', () => void stop());

try {
  for (const [index, entry] of configuration.projects.entries()) {
    if (!/^[\da-z][\da-z-]*$/.test(entry.id) || projects.some(({ id }) => id === entry.id)) {
      throw new Error(`Invalid or duplicate project id: ${entry.id}`);
    }
    const directory = path.resolve(entry.directory);
    const configDirectory = path.resolve(directory, entry.configDir ?? 'mockups/.storybook');
    const project = {
      id: entry.id,
      title: entry.title ?? entry.id,
      directory,
      configDirectory,
      runtimeDirectory: path.join(runtimeDirectory, entry.id),
      base: `/projects/${entry.id}/`,
      allowedHosts,
    };
    await mkdir(project.runtimeDirectory);
    await writeFile(
      path.join(project.runtimeDirectory, 'main.mjs'),
      `import { createProjectConfig } from ${JSON.stringify(new URL('./project-config.mjs', import.meta.url).href)};\nexport default await createProjectConfig(${JSON.stringify(project)});\n`
    );
    await writeFile(
      path.join(project.runtimeDirectory, 'middleware.mjs'),
      `export default router => router.server.prependListener('request', request => { if (request.url.startsWith(${JSON.stringify(project.base)})) request.url = request.url.slice(${project.base.length - 1}); });\n`
    );
    for (const name of await readdir(configDirectory)) {
      if (
        /^(preview|manager)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name) ||
        /^(preview|manager)-(head|body)\.html$/.test(name)
      ) {
        await symlink(path.join(configDirectory, name), path.join(project.runtimeDirectory, name));
      }
    }
    const require = createRequire(path.join(directory, 'package.json'));
    const token = randomUUID();
    const childPort = Number(configuration.internalPort ?? 16006) + index;
    const target = `http://127.0.0.1:${childPort}`;
    proxy[project.base] = {
      target,
      changeOrigin: true,
      ws: true,
    };
    proxy[`^/storybook-server-channel\\?token=${token}$`] = { target, ws: true };
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(new URL('./worker.mjs', import.meta.url)),
        require.resolve('storybook/internal/bin/dispatcher'),
        'dev',
        '--config-dir',
        project.runtimeDirectory,
        '--port',
        String(childPort),
        '--host',
        '127.0.0.1',
        '--exact-port',
        '--ci',
        '--no-open',
        '--disable-telemetry',
        '--no-version-updates',
      ],
      {
        cwd: directory,
        env: { ...process.env, STORYBOOK_HOST_WS_TOKEN: token },
        stdio: 'inherit',
        detached: process.platform !== 'win32',
      }
    );
    child.on('error', (error) => process.stderr.write(`[${project.id}] ${error.stack}\n`));
    child.on('exit', (code, signal) => {
      if (!stopping)
        process.stderr.write(`[${project.id}] Storybook stopped (${code ?? signal}).\n`);
    });
    projects.push({ ...project, child });
  }
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('./', import.meta.url)),
    appType: 'custom',
    server: {
      host,
      port,
      strictPort: true,
      allowedHosts,
      proxy,
      hmr: false,
      watch: null,
      fs: { allow: [fileURLToPath(new URL('./', import.meta.url))] },
    },
    plugins: [
      {
        name: 'storybook-projects',
        configureServer(vite) {
          return () =>
            vite.middlewares.use((request, response, next) => {
              const url = new URL(request.url, 'http://localhost');
              const project = projects.find(({ base }) => url.pathname === base.slice(0, -1));
              if (project) {
                response.writeHead(302, { Location: `${project.base}${url.search}` });
                response.end();
              } else if (url.pathname === '/') {
                response.setHeader('Content-Type', 'text/html; charset=utf-8');
                response.end(html);
              } else if (url.pathname === '/projects.json' || url.pathname === '/health') {
                response.setHeader('Content-Type', 'application/json');
                response.setHeader('Cache-Control', 'no-store');
                response.end(
                  JSON.stringify(
                    projects.map(({ id, title, base, child }) => ({
                      id,
                      title,
                      url: base,
                      running: child.exitCode === null && child.signalCode === null,
                    }))
                  )
                );
              } else next();
            });
        },
      },
    ],
  });
  await server.listen();
  server.printUrls();
} catch (error) {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
  await stop();
}
