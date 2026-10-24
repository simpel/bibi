// Tests for the time rule: node --test tools/lib/time-rules.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { checkTime } from "./time-rules.mjs";

const app = "apps/web/src/features/x/ui/x.tsx";
const problems = (content, relPath = app) => checkTime({ relPath, content });

test("flags local-time getters and setters", () => {
  assert.equal(problems("const h = date.getHours();").length, 1);
  assert.equal(problems("date.setDate(1);\ndate.getDate();").length, 2);
  assert.equal(problems("date.getFullYear()").length, 1);
});

test("allows UTC accessors", () => {
  assert.deepEqual(problems("date.getUTCHours(); date.setUTCDate(1);"), []);
});

test("flags new Date(y, m, d) but not single-argument or UTC forms", () => {
  assert.equal(problems("new Date(2026, 10, 1)").length, 1);
  assert.deepEqual(problems("new Date(value)"), []);
  assert.deepEqual(problems("new Date(Date.UTC(2026, 10, 1))"), []);
});

test("flags hard-coded zone names and relativeTime", () => {
  assert.equal(problems('const zone = "Europe/Oslo";').length, 1);
  assert.equal(problems("format.relativeTime(a, b)").length, 1);
});

test("ignores comments, tests, stories, the time module and zone constants", () => {
  assert.deepEqual(problems("// date.getHours() in Europe/Stockholm\n/* new Date(1, 2) */"), []);
  assert.deepEqual(problems("date.getHours()", "apps/web/src/x.test.ts"), []);
  assert.deepEqual(problems("date.getHours()", "packages/ui/src/stories/a.tsx"), []);
  assert.deepEqual(problems("date.getHours()", "packages/core/src/time/zoned-time.ts"), []);
  assert.deepEqual(problems('"Europe/Stockholm"', "packages/i18n/src/time-zone.ts"), []);
});
