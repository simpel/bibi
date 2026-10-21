// Tests for the rename codemod's CLI options and app-name file: node --test tools/rename-app-config.test.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readAppName, writeAppName } from "./lib/rename-app-config.mjs";
import { parseArgs } from "./rename-app.mjs";

const config = { name: "okazi", prefix: "okz_" };

test("parseArgs takes the old name and prefix from the app-name file", () => {
  const options = parseArgs({ argv: ["--to", "nova", "--to-prefix", "nov_"], config });
  assert.equal(options.from, "okazi");
  assert.equal(options.to, "nova");
  assert.equal(options.fromPrefix, "okz_");
  assert.equal(options.toPrefix, "nov_");
  assert.equal(options.nextPrefix, "nov_");
  assert.equal(options.dryRun, true);
  assert.equal(options.includeEnv, true);
  assert.deepEqual(options.keep, ["packages/db/prisma/migrations"]);
});

test("parseArgs requires --to, and --to-prefix while a prefix exists", () => {
  assert.throws(() => parseArgs({ argv: [], config }), /--to <name>/);
  assert.throws(() => parseArgs({ argv: ["--to", "nova"], config }), /--to-prefix/);
  assert.throws(() => parseArgs({ argv: ["--to", "nova"], config: null }), /--from/);
  const kept = parseArgs({ argv: ["--to", "nova", "--no-prefix"], config });
  assert.equal(kept.fromPrefix, "");
  assert.equal(kept.nextPrefix, "okz_");
});

test("parseArgs supports an explicit source and custom flags", () => {
  const argv = ["--from", "acme", "--to", "nova", "--write", "--skip-env", "--keep", "docs"];
  const custom = parseArgs({ argv: [...argv, "--rename-root"], config });
  assert.equal(custom.from, "acme");
  assert.equal(custom.fromPrefix, "");
  assert.equal(custom.toPrefix, "");
  assert.equal(custom.dryRun, false);
  assert.equal(custom.includeEnv, false);
  assert.deepEqual(custom.keep, ["packages/db/prisma/migrations", "docs"]);
  assert.equal(custom.renameRoot, true);
});

test("readAppName and writeAppName round-trip tools/app-name.json", () => {
  const root = mkdtempSync(join(tmpdir(), "rename-app-config-"));
  try {
    assert.equal(readAppName({ root }), null);
    mkdirSync(join(root, "tools"));
    writeAppName({ root, name: "bibi", prefix: "bib_" });
    assert.deepEqual(readAppName({ root }), { name: "bibi", prefix: "bib_" });
    assert.match(readFileSync(join(root, "tools/app-name.json"), "utf8"), /"name": "bibi"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
