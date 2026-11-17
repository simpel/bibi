// Tests for the database import rule: node --test tools/lib/import-rules.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { checkDbImport } from "./import-rules.mjs";

const web = "apps/web/src/features/x/actions.ts";
const problems = (content, relPath = web) => checkDbImport({ relPath, content });

test("flags runtime imports outside db, core and auth", () => {
  assert.equal(problems('import { getDb } from "@bibi/db";').length, 1);
  assert.equal(problems('import { type Db, getDb } from "@bibi/db";').length, 1);
  assert.equal(problems('import * as db from "@bibi/db/client";').length, 1);
  assert.equal(problems('const db = await import("@bibi/db");').length, 1);
});

test("allows type-only imports", () => {
  assert.deepEqual(problems('import type { Db } from "@bibi/db";'), []);
  assert.deepEqual(problems('import { type Db, type ScopedDb } from "@bibi/db";'), []);
});

test("allows the owners, tests and listed exemptions", () => {
  const runtime = 'import { getDb } from "@bibi/db";';
  assert.deepEqual(problems(runtime, "packages/core/src/a.ts"), []);
  assert.deepEqual(problems(runtime, "packages/auth/src/a.ts"), []);
  assert.deepEqual(problems(runtime, "apps/mcp/test/a.test.ts"), []);
  assert.deepEqual(problems(runtime, "apps/web/e2e/a.ts"), []);
  assert.deepEqual(problems(runtime, "apps/worker/src/main.ts"), []);
});

test("ignores comments", () => {
  assert.deepEqual(problems('// import { getDb } from "@bibi/db";\n/* "@bibi/db" */'), []);
});
