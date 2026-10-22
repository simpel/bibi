#!/usr/bin/env node
// Generic codemod that renames the app across packages, code, configs, docs, SQL and folder names.
// Dry run by default; --write applies it on a clean git tree and then checks for residue.
// The current name and prefix live in tools/app-name.json; a write updates that file.
// Usage:
//   node tools/rename-app.mjs --to <name> --to-prefix <prefix_> [--write]
//     [--from <name>] [--from-prefix <prefix_>] [--no-prefix] [--keep <path>]...
//     [--skip-env] [--include-self] [--rename-root] [--allow-dirty] [--json]
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyCodemod, buildReplacer } from "./lib/rename-app.mjs";
import { APP_NAME_FILE, readAppName, writeAppName } from "./lib/rename-app-config.mjs";
import { checkCleanTree, findResidue } from "./lib/rename-app-guards.mjs";
import { formatReport } from "./lib/rename-app-report.mjs";
import { DEFAULT_KEEP } from "./lib/rename-app-walk.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const VALUE_FLAGS = {
  "--from": "from",
  "--to": "to",
  "--from-prefix": "fromPrefix",
  "--to-prefix": "toPrefix",
  "--root": "root",
};

const BOOLEAN_FLAGS = {
  "--no-prefix": "noPrefix",
  "--write": "write",
  "--allow-dirty": "allowDirty",
  "--skip-env": "skipEnv",
  "--include-self": "includeSelf",
  "--rename-root": "renameRoot",
  "--json": "json",
  "--help": "help",
  "-h": "help",
};

export function usage({ current }) {
  const name = current
    ? `${current.name}${current.prefix ? `, prefix ${current.prefix}` : ""}`
    : "unset";
  return [
    "Usage: node tools/rename-app.mjs --to <name> --to-prefix <prefix> [options]",
    "",
    `Current app name (${APP_NAME_FILE}): ${name}`,
    "",
    "Runs as a dry run unless --write is given. Exits 1 when the old name would remain.",
    "",
    "Options:",
    "  --write                Apply the changes (needs a clean git tree)",
    "  --allow-dirty          Allow --write with uncommitted changes",
    "  --to <name>            New app name (required)",
    "  --to-prefix <prefix>   New short prefix, e.g. API keys (required when there is a current prefix)",
    `  --from <name>          Old app name (default: name in ${APP_NAME_FILE})`,
    `  --from-prefix <prefix> Old short prefix (default: prefix in ${APP_NAME_FILE})`,
    "  --no-prefix            Leave the short prefix as it is",
    `  --keep <path>          Leave a path untouched and allow its residue (default: ${DEFAULT_KEEP.join(", ")})`,
    "  --skip-env             Leave .env / .env.local untouched (they are renamed by default)",
    "  --include-self         Also transform this codemod and its tests",
    "  --rename-root          Also rename the repository root folder if its basename matches",
    "  --root <dir>           Target repository root (default: repo root)",
    "  --json                 Print the result and residue as JSON",
    "  --help, -h             Show this help message",
  ].join("\n");
}

function readFlags({ argv, defaultRoot }) {
  const flags = { root: defaultRoot, keep: [...DEFAULT_KEEP] };
  for (const key of Object.values(BOOLEAN_FLAGS)) flags[key] = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (Object.hasOwn(BOOLEAN_FLAGS, arg)) flags[BOOLEAN_FLAGS[arg]] = true;
    else if (Object.hasOwn(VALUE_FLAGS, arg)) flags[VALUE_FLAGS[arg]] = argv[++i] ?? "";
    else if (arg === "--keep") flags.keep.push(argv[++i] ?? "");
    else throw new Error(`Unknown option: ${arg}`);
  }
  return flags;
}

function resolvePrefixes({ flags, current, from }) {
  if (flags.noPrefix) return { fromPrefix: "", toPrefix: "", nextPrefix: current?.prefix ?? "" };
  const isCurrent = current && from.toLowerCase() === current.name.toLowerCase();
  const fromPrefix = flags.fromPrefix ?? (isCurrent ? current.prefix : "");
  if (fromPrefix && flags.toPrefix === undefined) {
    throw new Error(`Pass --to-prefix (the current prefix is "${fromPrefix}") or --no-prefix.`);
  }
  const toPrefix = flags.toPrefix ?? "";
  return { fromPrefix, toPrefix, nextPrefix: toPrefix };
}

// `config` is the current name from tools/app-name.json; tests pass it in directly.
export function parseArgs({ argv, defaultRoot = ROOT, config }) {
  const flags = readFlags({ argv, defaultRoot });
  if (!flags.root || flags.keep.some((path) => !path)) {
    throw new Error("--root and --keep need a path.");
  }
  const root = resolve(flags.root);
  const current = config === undefined ? readAppName({ root }) : config;
  if (flags.help) return { ...flags, root, current };
  const from = flags.from ?? current?.name;
  if (!from) throw new Error(`Pass --from: ${APP_NAME_FILE} is missing.`);
  if (!flags.to) throw new Error("Pass --to <name>, the new app name.");
  return {
    ...flags,
    root,
    current,
    from,
    ...resolvePrefixes({ flags, current, from }),
    dryRun: !flags.write,
    includeEnv: !flags.skipEnv,
  };
}

function main({ argv }) {
  const options = parseArgs({ argv });
  if (options.help) {
    console.log(usage({ current: options.current }));
    return;
  }
  if (!options.dryRun && !options.allowDirty) {
    const tree = checkCleanTree({ root: options.root });
    if (!tree.ok) {
      console.error(`Refusing to write: ${tree.reason}. Pass --allow-dirty to override.`);
      process.exitCode = 1;
      return;
    }
  }
  const result = applyCodemod(options);
  const root = result.rootRename?.applied ? result.rootRename.to : options.root;
  if (!options.dryRun) writeAppName({ root, name: options.to, prefix: options.nextPrefix });
  const replacer = buildReplacer(options);
  const residue = findResidue({ ...options, root, replacer, assumeApplied: options.dryRun });
  if (residue.residue.length > 0) process.exitCode = 1;
  const output = options.json
    ? JSON.stringify({ ...result, residue }, null, 2)
    : formatReport({ result, options, residue });
  console.log(output);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main({ argv: process.argv.slice(2) });
  } catch (error) {
    console.error(`${error.message}\nRun with --help for usage.`);
    process.exitCode = 1;
  }
}
