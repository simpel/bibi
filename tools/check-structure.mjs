#!/usr/bin/env node
// Strukturkontroll för Okazi. Körs med `pnpm check:structure` från repots rot.
// Granskar apps/* och packages/*: filer max 150 rader, funktioner max 40 rader,
// default export endast i Next-filer/config/stories, barrel-filer endast som
// packages/*/src/index.ts, och feature-mappar med krävda filer (paritet).
// Avslutar med kod 1 vid fel. Se tools/lib/ för reglerna.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkFeatures } from "./lib/features.mjs";
import { checkFile } from "./lib/file-rules.mjs";
import { analyzeFunctions } from "./lib/functions.mjs";
import { listPackageDirs, walkSources } from "./lib/scan.mjs";

// Filer som krävs i feature-mappar (<paket>/src/features/<entitet>/), per paket.
// - packages/core: kärnan. Varje entitet där måste ha schema.ts och operations.ts.
// - Adapterpaket (graphql, api, mcp): kontrolleras bara om paketet har src/features.
//   Då måste varje kärnentitet ha sin adapterfil (paritet). Ändra eller ta bort
//   en rad här för att justera eller stänga av den kontrollen för ett paket.
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
      const messages = [...checkFile({ relPath, content }), ...analyzeFunctions({ content })];
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
    return `Strukturkontroll OK: ${fileCount} filer, ${entityCount} entitet(er) i ${CORE_PACKAGE}.`;
  }
  const byFile = new Map();
  for (const { file, message } of problems) {
    byFile.set(file, [...(byFile.get(file) ?? []), message]);
  }
  const lines = [
    `Strukturkontroll misslyckades: ${problems.length} problem i ${byFile.size} fil(er).`,
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
