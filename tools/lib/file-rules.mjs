// Filregler för strukturkontrollen: radgräns, default export och barrel-filer.

export const MAX_FILE_LINES = 150;

// Default export tillåts bara för Next-filer, konfiguration och stories.
const DEFAULT_EXPORT_ALLOWED =
  /(^|\/)(page|layout|route|loading|error|not-found)\.tsx?$|\.config\.tsx?$|\.stories\.tsx$|(^|\/)\.storybook\//;
// Paketets index, samt core:s klientsäkra schema-barrel (`@okazi/core/schemas`).
const PACKAGE_INDEX = /^packages\/[^/]+\/src\/(index|schemas)\.tsx?$/;
const DEFAULT_EXPORT = /^\s*export\s+default\b/m;
const REEXPORT = /^export\s+(type\s+)?(\*|\{)[^;]*?\bfrom\s+["']/m;
const DECLARATION =
  /^(export\s+)?(default\s+)?(async\s+)?(function|const|let|var|class|interface|enum)\b|^(export\s+)?type\s+\w+\s*(<[^>]*>)?\s*=/m;

// Barrel = innehåller re-exporter och inga egna deklarationer.
export function isBarrel({ content }) {
  return REEXPORT.test(content) && !DECLARATION.test(content);
}

export function checkFile({ relPath, content }) {
  const problems = [];
  const lineCount = content.split("\n").length;
  if (lineCount > MAX_FILE_LINES) {
    problems.push(`${lineCount} rader (max ${MAX_FILE_LINES})`);
  }
  if (DEFAULT_EXPORT.test(content) && !DEFAULT_EXPORT_ALLOWED.test(relPath)) {
    problems.push("default export (tillåts bara i page/layout/route/config/stories)");
  }
  if (isBarrel({ content }) && !PACKAGE_INDEX.test(relPath)) {
    problems.push("barrel-fil (tillåts bara som packages/*/src/index.ts)");
  }
  return problems;
}
