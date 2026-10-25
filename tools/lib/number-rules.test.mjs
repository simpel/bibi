// Tests for the number rule: node --test tools/lib/number-rules.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { checkNumber } from "./number-rules.mjs";

const app = "apps/web/src/features/x/ui/x.tsx";
const problems = (content, relPath = app) => checkNumber({ relPath, content });

test("flags raw Intl.NumberFormat, currency styles and toLocaleString", () => {
  assert.equal(problems("new Intl.NumberFormat(locale).format(1)").length, 1);
  assert.equal(problems('{ style: "currency", currency: "SEK" }').length, 1);
  assert.equal(problems("(1000).toLocaleString(locale)").length, 1);
});

test("flags next-intl format.number but not the user's formatter", () => {
  assert.equal(problems("format.number(value, { style: 'percent' })").length, 1);
  assert.equal(problems("format.number(\n  value,\n)").length, 1);
  assert.deepEqual(problems("number({ value })"), []);
  assert.deepEqual(problems("format.number({\n  value })"), []);
  assert.deepEqual(problems("money({ minor })"), []);
});

test("ignores comments, tests, stories and the number module", () => {
  assert.deepEqual(problems("// new Intl.NumberFormat()\n/* x.toLocaleString() */"), []);
  assert.deepEqual(problems("x.toLocaleString()", "apps/web/src/x.test.ts"), []);
  assert.deepEqual(problems("x.toLocaleString()", "packages/ui/src/stories/a.tsx"), []);
  assert.deepEqual(problems("new Intl.NumberFormat()", "packages/core/src/number/a.ts"), []);
  assert.deepEqual(problems("new Intl.NumberFormat()", "apps/web/src/lib/number/a.ts"), []);
  assert.equal(problems("new Intl.NumberFormat()", "packages/core/src/money/a.ts").length, 1);
});
