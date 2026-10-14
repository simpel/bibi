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
  { template: "model.prisma.tpl", target: "packages/db/prisma/schema/{kebab}.prisma" },
  { template: "actions.ts.tpl", target: "apps/web/src/features/{kebab}/actions.ts" },
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

export function nextSteps({ names, plan }) {
  const { Pascal, kebab, camel } = names;
  return [
    `Created ${plan.length} files for ${Pascal}:`,
    ...plan.map((f) => `  ${f.relPath}`),
    "",
    "Checklist of files to change by hand (all required for parity, structure and type checks):",
    `  [ ] packages/db/prisma/schema/${kebab}.prisma: add domain fields, then pnpm db:generate and pnpm --filter @okazi/db migrate:dev.`,
    `  [ ] packages/db/src/scoped/models.ts: add "${Pascal}" to ORG_SCOPED_MODELS and to SOFT_DELETE_DEFAULTS (["${Pascal}", "ACTIVE"]).`,
    `  [ ] packages/core/src/index.ts, core-operations.ts and schemas.ts: export ${camel}Schema, the types and the operations; register the operations.`,
    `  [ ] packages/graphql/src/schema/schema.ts: add import "../features/${kebab}/graphql";`,
    "  [ ] packages/api and apps/mcp: register the REST routes and MCP tools from rest.ts and mcp.ts.",
    `  [ ] apps/web/src/features/web-surfaces.ts: add each ${kebab}.* operation to WEB_SURFACES (or UI_EXEMPT with a reason).`,
    `  [ ] apps/mcp/test/parity-entities.ts: add a ${kebab} entry to ENTITIES.`,
    `  [ ] packages/i18n/messages/sv.json and en.json: add the "${camel}" keys (skill i18n-strings).`,
    `  [ ] docs/domain-model.md and docs/artifacts/domain-model.html: add ${Pascal} together.`,
    `  [ ] Replace every TODO in the generated files (apps/web/src/features/${kebab}/ui/README.md lists the UI work).`,
    "  [ ] Verify: pnpm lint && pnpm check:structure && pnpm typecheck && pnpm test",
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
