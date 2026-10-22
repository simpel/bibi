#!/usr/bin/env node
// Structure check for Bibi. Run with `pnpm check:structure` from the repo root.
// Checks apps/* and packages/*: files max 150 lines, functions max 40 lines,
// default export only in Next files/config/stories, barrel files only as
// packages/*/src/index.ts, one typed object parameter per function, and feature folders with required files.
// Exits with code 1 on failure. See tools/lib/ for the rules.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkFeatures } from "./lib/features.mjs";
import { checkFile } from "./lib/file-rules.mjs";
import { analyzeFunctions } from "./lib/functions.mjs";
import { analyzeParams } from "./lib/params.mjs";
import { listPackageDirs, walkSources } from "./lib/scan.mjs";

// Files required in feature folders (<package>/src/features/<entity>/), per package.
// - packages/core: the core. Every entity there must have schema.ts and operations.ts.
// - Adapter packages (graphql, api, mcp): only checked if the package has src/features.
//   Then every core entity must have its adapter file (parity). Change or remove
//   a line here to adjust or disable that check for a package.
export const REQUIRED_FILES = {
  "packages/core": ["schema.ts", "operations.ts"],
  "packages/graphql": ["graphql.ts"],
  "packages/api": ["rest.ts"],
  "apps/mcp": ["mcp.ts"],
};
export const CORE_PACKAGE = "packages/core";

export function runChecks({ root }) {
  const problems = [];
  let fileCount = 0;
  for (const pkg of listPackageDirs({ root })) {
    for (const relPath of walkSources({ dir: join(root, pkg), root })) {
      fileCount++;
      const content = readFileSync(join(root, relPath), "utf8");
      const messages = [
        ...checkFile({ relPath, content }),
        ...analyzeFunctions({ content }),
        ...analyzeParams({ relPath, content }),
      ];
      for (const message of messages) problems.push({ file: relPath, message });
    }
  }
  const features = checkFeatures({
    root,
    requiredFiles: REQUIRED_FILES,
    corePackage: CORE_PACKAGE,
  });
  return {
    problems: [...problems, ...features.problems],
    fileCount,
    entityCount: features.entityCount,
  };
}

export function formatReport({ problems, fileCount, entityCount }) {
  if (problems.length === 0) {
    return `Structure check OK: ${fileCount} files, ${entityCount} entity(ies) in ${CORE_PACKAGE}.`;
  }
  const byFile = new Map();
  for (const { file, message } of problems) {
    byFile.set(file, [...(byFile.get(file) ?? []), message]);
  }
  const lines = [
    `Structure check failed: ${problems.length} problem(s) in ${byFile.size} file(s).`,
  ];
  for (const [file, messages] of byFile) {
    lines.push("", file, ...messages.map((message) => `  - ${message}`));
  }
  return lines.join("\n");
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runChecks({ root: ROOT });
  const report = formatReport(result);
  if (result.problems.length > 0) {
    console.error(report);
    process.exitCode = 1;
  } else {
    console.log(report);
  }
}
