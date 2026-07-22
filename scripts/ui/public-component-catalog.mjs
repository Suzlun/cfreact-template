import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import ts from 'typescript';

const DEFAULT_WORKSPACE_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const COMPONENT_NAME_PATTERN = /^[A-Z]/;

/**
 * OSごとの区切り文字を統一し、診断メッセージとパス比較を安定させる。
 *
 * @param {string} filename 正規化する絶対またはworkspace相対パス。
 * @returns {string} `/`区切りへ統一したパス。
 */
function normalizePath(filename) {
  return filename.replaceAll('\\', '/');
}

/**
 * workspace内の絶対パスを、人が追跡できるworkspace相対パスへ変換する。
 *
 * @param {string} workspaceRoot workspaceの絶対パス。
 * @param {string} filename 表示対象の絶対パス。
 * @returns {string} `/`区切りのworkspace相対パス。
 */
function toWorkspacePath(workspaceRoot, filename) {
  return normalizePath(path.relative(workspaceRoot, filename));
}

/**
 * `package.json#exports`の文字列ターゲットを解決し、公開subpathが指す実ファイルを得る。
 *
 * @param {Record<string, unknown>} packageExports UIパッケージが公開するexports。
 * @param {string} subpath `.`または`./components/button`形式の公開subpath。
 * @param {string} uiRoot UIパッケージの絶対パス。
 * @returns {string | undefined} 解決できた実ファイルの絶対パス。
 */
function resolvePackageExport(packageExports, subpath, uiRoot) {
  // 完全一致するexportを先に評価し、wildcardより具体的な公開契約を優先する。
  const exactTarget = Reflect.get(packageExports, subpath);
  if (typeof exactTarget === 'string') {
    return path.resolve(uiRoot, exactTarget);
  }

  // wildcardの捕捉文字列をtargetへ一度だけ展開し、現在の単一階層subpath契約を解決する。
  for (const [exportPattern, targetPattern] of Object.entries(packageExports)) {
    if (
      typeof targetPattern !== 'string' ||
      !exportPattern.includes('*') ||
      !targetPattern.includes('*')
    ) {
      continue;
    }

    const [prefix, suffix] = exportPattern.split('*');
    if (!subpath.startsWith(prefix) || !subpath.endsWith(suffix)) {
      continue;
    }

    const captured = subpath.slice(prefix.length, subpath.length - suffix.length);
    return path.resolve(uiRoot, targetPattern.replace('*', captured));
  }

  return undefined;
}

/**
 * 公開UIとして扱うソースと、対応するStory・公開import pathを列挙する。
 *
 * @param {string} workspaceRoot workspaceの絶対パス。
 * @returns {Array<{ sourceFile: string; storyFile: string; importPath: string; stem: string }>} 公開UIファイルの対応表。
 */
function getPublicUiTargets(workspaceRoot) {
  const uiRoot = path.join(workspaceRoot, 'packages/ui');
  const componentsRoot = path.join(uiRoot, 'components');

  // `package.json`の`./components/* -> *.tsx`契約に一致するTSXだけを公開UI候補にする。
  const componentTargets = fs
    .readdirSync(componentsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => {
      const stem = entry.name.slice(0, -'.tsx'.length);
      return {
        stem,
        sourceFile: path.join(componentsRoot, entry.name),
        storyFile: path.join(uiRoot, 'stories', `${stem}.stories.tsx`),
        importPath: `@cfreact-template/ui/components/${stem}`,
      };
    });

  // SafeHTMLはcomponents wildcard外の明示exportなので、同じ検査契約へ個別に加える。
  componentTargets.push({
    stem: 'safe-html',
    sourceFile: path.join(uiRoot, 'SafeHTML.tsx'),
    storyFile: path.join(uiRoot, 'stories', 'safe-html.stories.tsx'),
    importPath: '@cfreact-template/ui/SafeHTML',
  });

  return componentTargets.sort((left, right) => left.stem.localeCompare(right.stem));
}

/**
 * UIパッケージのtsconfigからTypeScript Programを構築し、barrelとaliasを含むexportを解決する。
 *
 * @param {string} workspaceRoot workspaceの絶対パス。
 * @returns {{ program: import('typescript').Program; diagnostics: string[] }} Programと設定診断。
 */
function createUiProgram(workspaceRoot) {
  const configPath = path.join(workspaceRoot, 'packages/ui/tsconfig.json');
  const configResult = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configResult.error !== undefined) {
    return {
      program: ts.createProgram([], {}),
      diagnostics: [ts.flattenDiagnosticMessageText(configResult.error.messageText, '\n')],
    };
  }

  // extends、include、pathsをTypeScript本体で解釈し、実際の`pnpm check`と同じ入力を得る。
  const parsedConfig = ts.parseJsonConfigFileContent(
    configResult.config,
    ts.sys,
    path.dirname(configPath)
  );
  const diagnostics = parsedConfig.errors.map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  );

  return {
    program: ts.createProgram(parsedConfig.fileNames, parsedConfig.options),
    diagnostics,
  };
}

/**
 * moduleの公開exportからruntime値を抽出し、type-only exportを除外する。
 *
 * @param {import('typescript').TypeChecker} checker exportを解決するTypeChecker。
 * @param {import('typescript').SourceFile} sourceFile 検査対象module。
 * @returns {string[]} runtimeで利用できるexport名。
 */
function getRuntimeExportNames(checker, sourceFile) {
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (moduleSymbol === undefined) {
    return [];
  }

  const runtimeExports = [];
  for (const exportedSymbol of checker.getExportsOfModule(moduleSymbol)) {
    // export listで作られたAliasは元宣言まで解決し、値空間を持つかを正しく判定する。
    const resolvedSymbol =
      (exportedSymbol.flags & ts.SymbolFlags.Alias) !== 0
        ? checker.getAliasedSymbol(exportedSymbol)
        : exportedSymbol;
    if ((resolvedSymbol.flags & ts.SymbolFlags.Value) !== 0 && exportedSymbol.name !== 'default') {
      runtimeExports.push(exportedSymbol.name);
    }
  }

  return runtimeExports.sort((left, right) => left.localeCompare(right));
}

/**
 * Storyが対応する公開subpathから読み込むruntime export名を静的に抽出する。
 *
 * @param {import('typescript').SourceFile} storySource StoryのSourceFile。
 * @param {string} importPath 対応するUI公開subpath。
 * @returns {string[]} Storyが実際にimportする公開値名。
 */
function getStoryRuntimeImports(storySource, importPath) {
  const importedNames = [];

  for (const statement of storySource.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== importPath ||
      statement.importClause?.isTypeOnly === true ||
      statement.importClause?.namedBindings === undefined ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue;
    }

    // alias importでも公開名をcatalogへ記録し、Story内だけのlocal名を外部契約へ混ぜない。
    for (const importSpecifier of statement.importClause.namedBindings.elements) {
      if (!importSpecifier.isTypeOnly) {
        importedNames.push(importSpecifier.propertyName?.text ?? importSpecifier.name.text);
      }
    }
  }

  return [...new Set(importedNames)].sort((left, right) => left.localeCompare(right));
}

/**
 * index.tsが明示しているmodule sourceを取得し、各公開UIファイルがbarrelから脱落していないか確認する。
 *
 * @param {import('typescript').SourceFile} indexSource UI barrelのSourceFile。
 * @returns {Set<string>} export元として宣言された公開module path。
 */
function getBarrelModulePaths(indexSource) {
  const modulePaths = new Set();

  for (const statement of indexSource.statements) {
    if (ts.isExportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      modulePaths.add(statement.moduleSpecifier.text);
    }
  }

  return modulePaths;
}

/**
 * UIの公開runtime export、Storybook網羅性、package exportを一度に検証する。
 *
 * @param {string} [workspaceRoot] workspaceの絶対パス。省略時は現在のrepository rootを使う。
 * @returns {{ componentNames: string[]; diagnostics: string[]; targets: Array<{ sourceFile: string; storyFile: string; importPath: string; stem: string }> }} 検証済みcatalogと診断。
 */
function inspectPublicUiCatalog(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
  const uiRoot = path.join(normalizedWorkspaceRoot, 'packages/ui');
  const packageJsonPath = path.join(uiRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageExports = packageJson.exports ?? {};
  const targets = getPublicUiTargets(normalizedWorkspaceRoot);
  const diagnostics = [];
  const componentNames = new Set();
  const { program, diagnostics: configDiagnostics } = createUiProgram(normalizedWorkspaceRoot);
  const checker = program.getTypeChecker();

  // tsconfig自体の不整合は後続のcatalog結果を信用できないため、先頭で明示する。
  diagnostics.push(...configDiagnostics.map((message) => `UI tsconfig: ${message}`));

  const indexPath = path.join(uiRoot, 'index.ts');
  const indexSource = program.getSourceFile(indexPath);
  const barrelModulePaths =
    indexSource === undefined ? new Set() : getBarrelModulePaths(indexSource);
  if (indexSource === undefined) {
    diagnostics.push('packages/ui/index.tsをTypeScript Programから解決できません。');
  } else {
    // barrel固有のalias名も公開コンポーネント名へ含め、SonnerToasterなどの再宣言を防ぐ。
    for (const exportName of getRuntimeExportNames(checker, indexSource)) {
      if (COMPONENT_NAME_PATTERN.test(exportName)) {
        componentNames.add(exportName);
      }
    }
  }

  const expectedStoryFiles = new Set(targets.map((target) => path.resolve(target.storyFile)));
  const storiesRoot = path.join(uiRoot, 'stories');
  const actualStoryFiles = fs
    .readdirSync(storiesRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.stories.tsx'))
    .map((entry) => path.resolve(storiesRoot, entry.name));

  // 対応する公開UIを持たないStoryを拒否し、catalogの1ファイル1公開対象という契約を保つ。
  for (const storyFile of actualStoryFiles) {
    if (!expectedStoryFiles.has(storyFile)) {
      diagnostics.push(
        `${toWorkspacePath(normalizedWorkspaceRoot, storyFile)}に対応する公開UIがありません。`
      );
    }
  }

  for (const target of targets) {
    const sourcePath = path.resolve(target.sourceFile);
    const storyPath = path.resolve(target.storyFile);
    const sourceFile = program.getSourceFile(sourcePath);
    const storyFile = program.getSourceFile(storyPath);
    const packageSubpath = target.importPath.slice('@cfreact-template/ui'.length);
    const exportSubpath = packageSubpath === '' ? '.' : `.${packageSubpath}`;
    const resolvedExport = resolvePackageExport(packageExports, exportSubpath, uiRoot);

    // Storyで案内するimport pathがpackage.jsonの公開契約と同じ実ファイルへ到達することを確認する。
    if (resolvedExport === undefined || path.resolve(resolvedExport) !== sourcePath) {
      diagnostics.push(
        `${target.importPath}がpackages/ui/package.jsonのexportsから${toWorkspacePath(normalizedWorkspaceRoot, sourcePath)}へ解決されません。`
      );
    }

    // すべての公開UIファイルをroot barrelからも発見できる状態にし、利用側の探索漏れを防ぐ。
    if (!barrelModulePaths.has(target.importPath)) {
      diagnostics.push(`${target.importPath}がpackages/ui/index.tsから公開されていません。`);
    }

    if (sourceFile === undefined) {
      diagnostics.push(
        `${toWorkspacePath(normalizedWorkspaceRoot, sourcePath)}をTypeScript Programから解決できません。`
      );
      continue;
    }
    if (storyFile === undefined) {
      diagnostics.push(`${toWorkspacePath(normalizedWorkspaceRoot, storyPath)}がありません。`);
      continue;
    }

    const runtimeExports = getRuntimeExportNames(checker, sourceFile);
    const runtimeImports = getStoryRuntimeImports(storyFile, target.importPath);
    const importedPublicValues = runtimeImports.filter((name) => runtimeExports.includes(name));

    // Storyが少なくとも一つの実UIを公開subpathから利用し、見た目だけの孤立例にならないようにする。
    if (importedPublicValues.length === 0) {
      diagnostics.push(
        `${toWorkspacePath(normalizedWorkspaceRoot, storyPath)}は${target.importPath}のruntime exportを利用していません。`
      );
    }

    // PascalCaseのruntime exportを共有コンポーネントとして登録し、型やhookを同名禁止対象へ混ぜない。
    for (const exportName of runtimeExports) {
      if (COMPONENT_NAME_PATTERN.test(exportName)) {
        componentNames.add(exportName);
      }
    }
  }

  return {
    componentNames: [...componentNames].sort((left, right) => left.localeCompare(right)),
    diagnostics,
    targets,
  };
}

/**
 * ESLint設定で利用する検証済み公開UI名を返し、catalog不整合時はlint開始前に停止する。
 *
 * @param {string} [workspaceRoot] workspaceの絶対パス。
 * @returns {string[]} 公開されているPascalCaseのruntime UI名。
 * @throws {Error} package export、barrel、Storybookのいずれかが不整合な場合。
 */
function loadPublicUiComponentNames(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  const catalog = inspectPublicUiCatalog(workspaceRoot);
  if (catalog.diagnostics.length > 0) {
    throw new Error(`公開UI catalogが不整合です。\n- ${catalog.diagnostics.join('\n- ')}`);
  }
  return catalog.componentNames;
}

export { inspectPublicUiCatalog, loadPublicUiComponentNames };
