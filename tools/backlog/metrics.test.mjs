// node --test tools/backlog/metrics.test.mjs
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { appendRun, minutesBetween, readRuns } from "./metrics-store.mjs";
import { report } from "./metrics-report.mjs";

test("minutes are measured between two timestamps, null without a start", () => {
  assert.equal(minutesBetween({ since: "2026-10-22T10:00:00Z", at: "2026-10-22T11:43:00Z" }), 103);
  assert.equal(minutesBetween({ since: undefined, at: "2026-10-22T11:43:00Z" }), null);
});

test("runs are appended and read back, a missing file is empty", () => {
  const file = join(mkdtempSync(join(tmpdir(), "metrics-")), "sub", "runs.jsonl");
  assert.deepEqual(readRuns({ file }), []);
  appendRun({ file, run: { path: "inline", minutes: 20, tickets: [] } });
  appendRun({ file, run: { path: "gate-none", minutes: null, tickets: [] } });
  assert.equal(readRuns({ file }).length, 2);
});

test("the report counts runs per path and gate refusals", () => {
  const file = join(mkdtempSync(join(tmpdir(), "metrics-")), "runs.jsonl");
  assert.match(report({ file }), /No runs recorded/);
  appendRun({ file, run: { path: "inline", minutes: 20, tickets: [{ number: 1, outcome: "armed" }] } });
  appendRun({ file, run: { path: "gate-inline", minutes: null, tickets: [] } });
  const text = report({ file });
  assert.match(text, /inline 1/);
  assert.match(text, /20 min per ticket/);
  assert.match(text, /1 runs sent inline/);
});
