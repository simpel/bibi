#!/usr/bin/env node
// Skapar en ny entitet från mallarna i tools/templates/entity/.
// Användning: pnpm gen entity <Name>   (t.ex. pnpm gen entity AgendaItem)
// Skriver bara nya filer. Befintliga filer skrivs aldrig över; generatorn avbryter i så fall utan att skriva något.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveNames, ENTITY_NAME, renderTemplate } from "./lib/entity-names.mjs";

const TOOLS_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOLS_DIR, "..");
const TEMPLATE_DIR = join(TOOLS_DIR, "templates", "entity");

// Mall och målfil (relativt repots rot). {kebab} ersätts med entitetens kebab-namn.
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
  return "Användning: pnpm gen entity <Name>   (PascalCase, t.ex. Venue eller AgendaItem)";
}

function main({ argv }) {
  const [kind, name] = argv;
  if (kind !== "entity" || !name) return fail({ message: usage() });
  if (!ENTITY_NAME.test(name))
    return fail({ message: `Ogiltigt namn "${name}". Använd PascalCase, t.ex. Venue.` });

  const names = deriveNames({ name });
  const plan = planFiles({ names });
  const existing = plan.filter(({ relPath }) => existsSync(join(ROOT, relPath)));
  if (existing.length > 0) {
    const message = [
      "Avbryter, dessa filer finns redan (skrivs aldrig över):",
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
    `Skapade ${plan.length} filer för ${names.Pascal}:`,
    ...plan.map((f) => `  ${f.relPath}`),
    "",
    "Nästa steg:",
    `  1. Komplettera fält i schema.ts och lägg till ${names.Pascal} i ordlistan (docs/domanmodell.md).`,
    "  2. Exportera från packages/core/src/index.ts och registrera operationerna.",
    "  3. Lägg till Prisma-modellen i packages/db/prisma, kör pnpm db:generate och pnpm db:migrate.",
    "  4. Koppla rutter (packages/api), GraphQL-typ (packages/graphql) och MCP-verktyg (apps/mcp).",
    "  5. Ersätt alla TODO, sedan pnpm check:structure, pnpm typecheck och pnpm test (paritetstestet).",
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
