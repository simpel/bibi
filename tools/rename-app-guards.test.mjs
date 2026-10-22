// Tests for the codemod's safety guards: node --test tools/rename-app-guards.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { applyCodemod, buildReplacer } from "./lib/rename-app.mjs";
import { checkCleanTree, findResidue } from "./lib/rename-app-guards.mjs";

const MIGRATION = "packages/db/prisma/migrations/0001_init/migration.sql";
const NAMES = { from: "okazi", to: "bibi", fromPrefix: "okz_", toPrefix: "bib_" };
const replacer = buildReplacer(NAMES);

function makeRepo() {
  const sandbox = mkdtempSync(join(tmpdir(), "rename-app-guards-"));
  const root = join(sandbox, "repo");
  mkdirSync(join(root, "packages/db/prisma/migrations/0001_init"), { recursive: true });
  writeFileSync(join(root, MIGRATION), "SELECT set_config('okazi.flag', 'on', true);\n");
  writeFileSync(join(root, "app.ts"), 'export const NAME = "okazi";\n');
  writeFileSync(join(root, ".git"), "gitdir: /Users/x/Code/okazi/.git/worktrees/t-1\n");
  writeFileSync(join(root, "logo.bin"), Buffer.from([0, 1, 2, ...Buffer.from("Okazi")]));
  return { sandbox, root };
}

test("applyCodemod leaves applied migrations and a worktree .git file untouched", () => {
  const { sandbox, root } = makeRepo();
  try {
    const result = applyCodemod({ ...NAMES, root, dryRun: false });
    assert.deepEqual(
      result.modifiedFiles.map((item) => item.file),
      ["app.ts"],
    );
    assert.match(readFileSync(join(root, MIGRATION), "utf8"), /okazi\.flag/);
    assert.match(readFileSync(join(root, ".git"), "utf8"), /Code\/okazi\/\.git/);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test("findResidue predicts residue in a dry run and finds it after a write", () => {
  const { sandbox, root } = makeRepo();
  try {
    const keep = ["packages/db/prisma/migrations"];
    const predicted = findResidue({ root, replacer, keep, assumeApplied: true });
    assert.deepEqual(predicted.residue, [{ path: "logo.bin", kind: "binary" }]);
    assert.deepEqual([...new Set(predicted.kept.map((hit) => hit.path))], [MIGRATION]);

    applyCodemod({ ...NAMES, root, dryRun: false, includeEnv: false, keep });
    writeFileSync(join(root, "late.md"), "Okazi\n");
    const actual = findResidue({ root, replacer, keep });
    assert.deepEqual(actual.residue.map((hit) => hit.path).sort(), ["late.md", "logo.bin"]);
    assert.equal(actual.residue.find((hit) => hit.path === "late.md")?.line, 1);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test("checkCleanTree refuses non-repositories and uncommitted changes", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "rename-app-git-"));
  try {
    assert.equal(checkCleanTree({ root: sandbox }).ok, false);
    execFileSync("git", ["init", "-q"], { cwd: sandbox });
    assert.equal(checkCleanTree({ root: sandbox }).ok, true);
    writeFileSync(join(sandbox, "new.txt"), "x");
    const dirty = checkCleanTree({ root: sandbox });
    assert.equal(dirty.ok, false);
    assert.deepEqual(dirty.dirty, ["?? new.txt"]);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
