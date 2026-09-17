import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** 元の設定の解決基点を保ち、共有入口の公開パスだけを重ねる。 */
export async function createProjectConfig(project) {
  const require = createRequire(path.join(project.directory, 'package.json'));
  const { loadMainConfig } = await import(
    pathToFileURL(require.resolve('storybook/internal/common'))
  );
  const original = await loadMainConfig({ configDir: project.configDirectory });
  const fromConfig = (value) => path.resolve(project.configDirectory, value);
  const packageDirectory = (name) =>
    name.startsWith('.') || path.isAbsolute(name)
      ? fromConfig(name)
      : path.dirname(require.resolve(`${name}/package.json`));
  const framework =
    typeof original.framework === 'string' ? { name: original.framework } : original.framework;

  return {
    ...original,
    stories: (original.stories ?? []).map((story) =>
      typeof story === 'string'
        ? fromConfig(story)
        : { ...story, directory: fromConfig(story.directory) }
    ),
    staticDirs: (original.staticDirs ?? []).map((entry) =>
      typeof entry === 'string' ? fromConfig(entry) : { ...entry, from: fromConfig(entry.from) }
    ),
    framework: { ...framework, name: packageDirectory(framework.name) },
    addons: (original.addons ?? []).map((addon) =>
      typeof addon === 'string'
        ? packageDirectory(addon)
        : { ...addon, name: packageDirectory(addon.name) }
    ),
    core: { ...original.core, allowedHosts: project.allowedHosts, disableTelemetry: true },
    async viteFinal(config, options) {
      const configured = original.viteFinal ? await original.viteFinal(config, options) : config;
      const hmr = typeof configured.server?.hmr === 'object' ? configured.server.hmr : {};
      return {
        ...configured,
        root: path.dirname(project.configDirectory),
        base: project.base,
        plugins: [
          ...(configured.plugins ?? []),
          {
            name: 'storybook-host-entry-paths',
            transformIndexHtml: {
              order: 'post',
              // Storybook 10がルート固定で挿入する起動用モジュールも公開パスへ揃える。
              handler: (html) =>
                html
                  .replaceAll(
                    '"/vite-inject-mocker-entry.js"',
                    `"${project.base}vite-inject-mocker-entry.js"`
                  )
                  .replaceAll(
                    '"/@id/__x00__virtual:/@storybook/builder-vite/vite-app.js"',
                    `"${project.base}@id/__x00__virtual:/@storybook/builder-vite/vite-app.js"`
                  ),
            },
          },
        ],
        cacheDir: path.join(project.runtimeDirectory, 'node_modules/.vite'),
        server: {
          ...configured.server,
          allowedHosts: project.allowedHosts,
          fs: {
            ...configured.server?.fs,
            allow: [project.directory, project.runtimeDirectory],
            deny: [
              '.env',
              '.env.*',
              '.dev.vars',
              '.dev.vars.*',
              '*.{crt,pem,key,p12,pfx,cer,der}',
              '.npmrc',
              '.yarnrc.yml',
              '**/.git/**',
              '**/.wrangler/**',
              ...(configured.server?.fs?.deny ?? []),
              '**/.devcontainer/.volumes/**',
              '**/.devcontainer/.host-git/**',
            ],
          },
          // 接続先はブラウザが読み込んだ入口から導出し、内部ポートを外へ出さない。
          hmr: { ...hmr, host: undefined, port: undefined, clientPort: undefined },
        },
      };
    },
  };
}
