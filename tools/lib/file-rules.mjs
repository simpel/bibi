// File rules for the structure check: line limit, default export and barrel files.

export const MAX_FILE_LINES = 150;

// Default export is only allowed for Next files, config and stories.
const DEFAULT_EXPORT_ALLOWED =
  /(^|\/)(page|layout|route|loading|error|not-found|robots|sitemap)\.tsx?$|\.config\.tsx?$|\.stories\.tsx$|(^|\/)\.storybook\//;
// The package index, plus core's client-safe schema barrel (`@bibi/core/schemas`).
const PACKAGE_INDEX = /^packages\/[^/]+\/src\/(index|schemas)\.tsx?$/;
const DEFAULT_EXPORT = /^\s*export\s+default\b/m;
const REEXPORT = /^export\s+(type\s+)?(\*|\{)[^;]*?\bfrom\s+["']/m;
const DECLARATION =
  /^(export\s+)?(default\s+)?(async\s+)?(function|const|let|var|class|interface|enum)\b|^(export\s+)?type\s+\w+\s*(<[^>]*>)?\s*=/m;

// Barrel = contains re-exports and no declarations of its own.
export function isBarrel({ content }) {
  return REEXPORT.test(content) && !DECLARATION.test(content);
}

export function checkFile({ relPath, content }) {
  const problems = [];
  const lineCount = content.split("\n").length;
  if (lineCount > MAX_FILE_LINES) {
    problems.push(`${lineCount} lines (max ${MAX_FILE_LINES})`);
  }
  if (DEFAULT_EXPORT.test(content) && !DEFAULT_EXPORT_ALLOWED.test(relPath)) {
    problems.push(
      "default export (only allowed in page/layout/route/robots/sitemap/config/stories)",
    );
  }
  if (isBarrel({ content }) && !PACKAGE_INDEX.test(relPath)) {
    problems.push("barrel file (only allowed as packages/*/src/index.ts)");
  }
  return problems;
}
