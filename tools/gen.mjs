#!/usr/bin/env node
// Creates a new entity from the templates in tools/templates/entity/.
// Usage: pnpm gen entity <Name>   (e.g. pnpm gen entity AgendaItem)
// Only writes new files. Existing files are never overwritten; the generator then aborts without writing anything.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveNames, ENTITY_NAME, renderTemplate } from "./lib/entity-names.mjs";

const TOOLS_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOLS_DIR, "..");
const TEMPLATE_DIR = join(TOOLS_DIR, "templates", "entity");

// Template and target file (relative to the repo root). {kebab} is replaced by the entity's kebab-case name.
export const TARGETS = [
  { template: "schema.ts.tpl", target: "packages/core/src/features/{kebab}/schema.ts" },
  { template: "operations.ts.tpl", target: "packages/core/src/features/{kebab}/operations.ts" },
  { template: "embeddable.ts.tpl", target: "packages/core/src/features/{kebab}/embeddable.ts" },
  { template: "graphql.ts.tpl", target: "packages/graphql/src/features/{kebab}/graphql.ts" },
  { template: "rest.ts.tpl", target: "packages/api/src/features/{kebab}/rest.ts" },
  { template: "mcp.ts.tpl", target: "apps/mcp/src/features/{kebab}/mcp.ts" },
  { template: "ui-note.md.tpl", target: "apps/web/src/features/{kebab}/ui/README.md" },
];

export function planFiles({ names }) {
  return TARGETS.map(({ template, target }) => ({
    templatePath: join(TEMPLATE_DIR, template),
    relPath: target.replace("{kebab}", names.kebab),
  }));
}

function usage() {
  return "Usage: pnpm gen entity <Name>   (PascalCase, e.g. Venue or AgendaItem)";
}

function main({ argv }) {
  const [kind, name] = argv;
  if (kind !== "entity" || !name) return fail({ message: usage() });
  if (!ENTITY_NAME.test(name))
    return fail({ message: `Invalid name "${name}". Use PascalCase, e.g. Venue.` });

  const names = deriveNames({ name });
  const plan = planFiles({ names });
  const existing = plan.filter(({ relPath }) => existsSync(join(ROOT, relPath)));
  if (existing.length > 0) {
    const message = [
      "Aborting, these files already exist (never overwritten):",
      ...existing.map((f) => `  ${f.relPath}`),
    ].join("\n");
    return fail({ message });
  }

  for (const { templatePath, relPath } of plan) {
    const text = renderTemplate({ text: readFileSync(templatePath, "utf8"), names });
    mkdirSync(dirname(join(ROOT, relPath)), { recursive: true });
    writeFileSync(join(ROOT, relPath), text, { flag: "wx" });
  }
  console.log(nextSteps({ names, plan }));
  return 0;
}

function nextSteps({ names, plan }) {
  return [
    `Created ${plan.length} files for ${names.Pascal}:`,
    ...plan.map((f) => `  ${f.relPath}`),
    "",
    "Next steps:",
    `  1. Complete the fields in schema.ts and add ${names.Pascal} to the glossary (docs/domain-model.md).`,
    "  2. Export from packages/core/src/index.ts and register the operations.",
    "  3. Add the Prisma model in packages/db/prisma, run pnpm db:generate and pnpm db:migrate.",
    "  4. Wire up routes (packages/api), the GraphQL type (packages/graphql) and MCP tools (apps/mcp).",
    "  5. Replace every TODO, then run pnpm check:structure, pnpm typecheck and pnpm test (the parity test).",
  ].join("\n");
}

function fail({ message }) {
  console.error(message);
  process.exitCode = 1;
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main({ argv: process.argv.slice(2) });
}
