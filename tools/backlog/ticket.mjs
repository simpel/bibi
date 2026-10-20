#!/usr/bin/env node
// Create or update a ticket on the okazi board with every required field in one step.
//   node tools/backlog/ticket.mjs create --spec spec.json [--dry-run]
//     spec: { title, body, labels?, status? (default Backlog), priority?, size, kind, model? }
//   node tools/backlog/ticket.mjs set <number> [--status S] [--priority P] [--size Z] [--kind K] [--model M]
// Field values are checked against the board's own options. Prints one JSON object. See the new-ticket skill.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OWNER = "simpel";
const REPO = "simpel/okazi";
const PROJECT = "8";
const FIELD_OF = {
  status: "Status",
  priority: "Priority",
  size: "Size",
  kind: "Kind",
  model: "Model",
};

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
}

function boardFields() {
  const view = ["project", "view", PROJECT, "--owner", OWNER, "--format", "json", "-q", ".id"];
  const list = ["project", "field-list", PROJECT, "--owner", OWNER, "--format", "json"];
  const fields = new Map(JSON.parse(gh(list)).fields.map((f) => [f.name, f]));
  return { projectId: gh(view), fields };
}

function optionId({ fields, key, value }) {
  const field = fields.get(FIELD_OF[key]);
  const options = field?.options ?? [];
  const hit = options.find((o) => o.name.toLowerCase() === String(value).toLowerCase());
  if (!hit) {
    const valid = options.map((o) => o.name).join(", ");
    throw new Error(`${FIELD_OF[key]} "${value}" is not an option. Valid: ${valid}`);
  }
  return { fieldId: field.id, optionId: hit.id };
}

// Hard errors stop the command. Warnings are printed and the ticket is still created.
export function validateSpec({ spec }) {
  const errors = [];
  const warnings = [];
  const body = spec.body ?? "";
  if (!spec.title) errors.push("title is required");
  if (!spec.size) errors.push("size is required (XS, S, M, L, XL)");
  if (!spec.kind) errors.push("kind is required (Feature, Bugfix, Codemod, Tech debt, Docs, Test)");
  const needsSeed = ["feature", "codemod"].includes(String(spec.kind).toLowerCase());
  if (!/^#{2,4}\s*Seed data\s*$/im.test(body)) {
    (needsSeed ? errors : warnings).push('the body has no "### Seed data" section');
  }
  if (String(spec.kind).toLowerCase() === "codemod" && !/^#{2,4}\s*Renames\s*$/im.test(body)) {
    errors.push('a Codemod ticket needs a "### Renames" section (old name -> new name)');
  }
  if (!spec.priority) warnings.push("no priority set");
  return { errors, warnings };
}

function itemIdFor({ number, url }) {
  try {
    const args = [
      "project",
      "item-add",
      PROJECT,
      "--owner",
      OWNER,
      "--url",
      url,
      "--format",
      "json",
    ];
    return JSON.parse(gh(args)).id;
  } catch {
    // The project may have auto-added the issue already.
    const query = `query($n:Int!){repository(owner:"${OWNER}",name:"okazi"){issue(number:$n){projectItems(first:10){nodes{id project{number}}}}}}`;
    const out = JSON.parse(gh(["api", "graphql", "-f", `query=${query}`, "-F", `n=${number}`]));
    const nodes = out.data.repository.issue.projectItems.nodes;
    return nodes.find((n) => n.project.number === Number(PROJECT)).id;
  }
}

function setFields({ itemId, values, board }) {
  for (const key of Object.keys(FIELD_OF)) {
    if (!values[key]) continue;
    const { fieldId, optionId: option } = optionId({
      fields: board.fields,
      key,
      value: values[key],
    });
    const args = ["project", "item-edit", "--project-id", board.projectId, "--id", itemId];
    gh([...args, "--field-id", fieldId, "--single-select-option-id", option]);
  }
}

function create({ spec, dryRun }) {
  const { errors, warnings } = validateSpec({ spec });
  if (errors.length) return { ok: false, errors, warnings };
  const values = { status: "Backlog", ...spec };
  const board = boardFields();
  for (const key of Object.keys(FIELD_OF)) {
    if (values[key]) optionId({ fields: board.fields, key, value: values[key] });
  }
  if (dryRun) return { ok: true, dryRun: true, warnings, values };
  const file = join(mkdtempSync(join(tmpdir(), "ticket-")), "body.md");
  writeFileSync(file, spec.body);
  const args = ["issue", "create", "-R", REPO, "--title", spec.title, "--body-file", file];
  for (const label of spec.labels ?? []) args.push("--label", label);
  const url = gh(args);
  const number = Number(url.split("/").pop());
  setFields({ itemId: itemIdFor({ number, url }), values, board });
  return { ok: true, number, url, warnings };
}

function set({ number, values }) {
  const url = `https://github.com/${REPO}/issues/${number}`;
  const board = boardFields();
  setFields({ itemId: itemIdFor({ number, url }), values, board });
  return { ok: true, number, values };
}

function parse({ argv }) {
  const [command, ...rest] = argv;
  const flags = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--dry-run") flags.dryRun = true;
    else if (rest[i].startsWith("--")) flags[rest[i].slice(2)] = rest[++i];
    else positional.push(rest[i]);
  }
  return { command, flags, positional };
}

function main() {
  try {
    const { command, flags, positional } = parse({ argv: process.argv.slice(2) });
    if (command === "create") {
      const spec = JSON.parse(readFileSync(flags.spec, "utf8"));
      const out = create({ spec, dryRun: Boolean(flags.dryRun) });
      console.log(JSON.stringify(out));
      process.exitCode = out.ok ? 0 : 1;
    } else if (command === "set") {
      const { dryRun: _ignored, ...values } = flags;
      console.log(JSON.stringify(set({ number: Number(positional[0]), values })));
    } else {
      throw new Error(
        "usage: ticket.mjs create --spec file.json [--dry-run] | set <number> --kind K ...",
      );
    }
  } catch (error) {
    console.log(
      JSON.stringify({
        ok: false,
        errors: [error instanceof Error ? error.message : String(error)],
      }),
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
