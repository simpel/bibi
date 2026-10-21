// Human-readable report for the app-rename codemod (tools/rename-app.mjs).
const MAX_RESIDUE_LINES = 50;

function describeHit({ hit }) {
  if (hit.kind === "content") return `${hit.path}:${hit.line}  ${hit.text}`;
  if (hit.kind === "binary") return `${hit.path}  (binary file contains the name)`;
  return `${hit.path}  (path name)`;
}

function rootStatus({ result, options }) {
  if (result.rootRename.applied) return "renamed";
  return options.renameRoot ? "would rename" : "skipped (pass --rename-root to rename)";
}

function residueLines({ residue, dryRun }) {
  const verb = dryRun ? "would remain" : "remaining";
  const lines = [
    `  Kept paths with the name: ${new Set(residue.kept.map((hit) => hit.path)).size}`,
  ];
  for (const path of new Set(residue.kept.map((hit) => hit.path))) lines.push(`    ${path}`);
  lines.push(`  Residue (${verb}): ${residue.residue.length}`);
  for (const hit of residue.residue.slice(0, MAX_RESIDUE_LINES)) {
    lines.push(`    ${describeHit({ hit })}`);
  }
  if (residue.residue.length > MAX_RESIDUE_LINES) {
    lines.push(`    … and ${residue.residue.length - MAX_RESIDUE_LINES} more (use --json)`);
  }
  return lines;
}

export function formatReport({ result, options, residue }) {
  const mode = result.dryRun ? "[DRY RUN, pass --write to apply] " : "";
  const prefixNote =
    options.fromPrefix && options.toPrefix
      ? ` (plus prefix "${options.fromPrefix}" -> "${options.toPrefix}")`
      : "";
  const lines = [
    `${mode}Renamed "${options.from}" -> "${options.to}"${prefixNote}`,
    `  Files updated:      ${result.modifiedFiles.length}`,
    `  Total replacements: ${result.totalReplacements}`,
    `  Paths renamed:      ${result.renamedPaths.length}`,
  ];
  for (const item of result.renamedPaths) {
    lines.push(`    ${item.from} -> ${item.to}`);
  }
  if (result.rootRename) {
    const { from, to } = result.rootRename;
    lines.push(`  Root folder:        ${from} -> ${to} (${rootStatus({ result, options })})`);
  }
  return [...lines, ...residueLines({ residue, dryRun: result.dryRun })].join("\n");
}
