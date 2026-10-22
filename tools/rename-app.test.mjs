// Tests for rename-app.mjs: node --test tools/rename-app.test.mjs
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { applyCodemod, buildReplacer, replaceText } from "./lib/rename-app.mjs";

const NAMES = { from: "okazi", to: "bibi", fromPrefix: "okz_", toPrefix: "bib_" };

test("replaceText preserves lowercase, PascalCase, UPPERCASE and prefix casings", () => {
  const replacer = buildReplacer({
    from: "okazi",
    to: "bibi",
    fromPrefix: "okz_",
    toPrefix: "bib_",
  });
  const sample = [
    'import { execute } from "@okazi/core";',
    "export const API_KEY_PREFIX = 'okz_';",
    "const envKey = process.env.OKAZI_API_KEY;",
    "// Okazi's booking system and Okazis inloggningssida",
    "const header = 'x-okazi-conversation-id';",
    "holder.__okaziDb ??= createDb();",
    "PERFORM set_config('okazi.history_projection', 'on', true);",
  ].join("\n");

  const { output, count, changed } = replaceText({ text: sample, replacer });
  assert.equal(changed, true);
  assert.equal(count, 8);
  assert.equal(
    output,
    [
      'import { execute } from "@bibi/core";',
      "export const API_KEY_PREFIX = 'bib_';",
      "const envKey = process.env.BIBI_API_KEY;",
      "// Bibi's booking system and Bibis inloggningssida",
      "const header = 'x-bibi-conversation-id';",
      "holder.__bibiDb ??= createDb();",
      "PERFORM set_config('bibi.history_projection', 'on', true);",
    ].join("\n"),
  );
});

test("applyCodemod transforms files and .env, renames matching paths and respects dry run", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "rename-app-test-"));
  try {
    const repoRoot = join(sandbox, "okazi");
    mkdirSync(join(repoRoot, "packages", "okazi-utils"), { recursive: true });
    mkdirSync(join(repoRoot, "node_modules", "@okazi"), { recursive: true });
    writeFileSync(
      join(repoRoot, "package.json"),
      JSON.stringify({ name: "okazi", dependencies: { "@okazi/core": "workspace:*" } }),
    );
    writeFileSync(
      join(repoRoot, "packages", "okazi-utils", "okazi-helper.ts"),
      'export const KEY = "okz_123";\nexport const APP = "Okazi";\n',
    );
    writeFileSync(join(repoRoot, ".env"), "OKAZI_API_KEY=okz_secret\n");
    writeFileSync(join(repoRoot, "node_modules", "@okazi", "ignore.js"), "okazi");

    const dry = applyCodemod({ ...NAMES, root: repoRoot, dryRun: true, renameRoot: true });
    assert.equal(dry.modifiedFiles.length, 3);
    assert.equal(dry.renamedPaths.length, 2);
    assert.equal(dry.rootRename?.applied, false);
    assert.equal(existsSync(join(repoRoot, "packages", "okazi-utils", "okazi-helper.ts")), true);

    const applied = applyCodemod({ ...NAMES, root: repoRoot, dryRun: false, renameRoot: true });
    assert.equal(applied.modifiedFiles.length, 3);
    assert.equal(applied.rootRename?.applied, true);

    const newRepoRoot = join(sandbox, "bibi");
    assert.equal(existsSync(newRepoRoot), true);
    const pkgJson = readFileSync(join(newRepoRoot, "package.json"), "utf8");
    assert.match(pkgJson, /"name":"bibi"/);
    assert.match(pkgJson, /"@bibi\/core"/);

    const helperContent = readFileSync(
      join(newRepoRoot, "packages", "bibi-utils", "bibi-helper.ts"),
      "utf8",
    );
    assert.equal(helperContent, 'export const KEY = "bib_123";\nexport const APP = "Bibi";\n');

    // .env is renamed by default so it keeps matching the code; node_modules is untouched
    assert.equal(readFileSync(join(newRepoRoot, ".env"), "utf8"), "BIBI_API_KEY=bib_secret\n");
    assert.equal(
      readFileSync(join(newRepoRoot, "node_modules", "@okazi", "ignore.js"), "utf8"),
      "okazi",
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});
