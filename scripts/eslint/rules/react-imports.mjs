/**
 * `import { default as ReactAlias }`を通常のdefault importと同じbindingとして判定する。
 *
 * @param {import('estree').ImportSpecifier} specifier named importの指定子。
 * @returns {boolean} default exportを別名importしている場合はtrue。
 */
function isAliasedDefaultImport(specifier) {
  return (
    (specifier.imported.type === 'Identifier' && specifier.imported.name === 'default') ||
    (specifier.imported.type === 'Literal' && specifier.imported.value === 'default')
  );
}

export { isAliasedDefaultImport };
