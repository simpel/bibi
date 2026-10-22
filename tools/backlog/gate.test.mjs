// node --test tools/backlog/gate.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { decide, parallelCount } from "./gate.mjs";

const T = (number, size = "M", extra = {}) => ({
  number,
  size,
  kind: "Feature",
  labels: [],
  priority: "P1",
  status: "Todo",
  openBlockers: [],
  ...extra,
});

test("nothing ready is none", () => {
  assert.equal(decide({ tickets: [T(1, "M", { openBlockers: [9] })] }).path, "none");
});

test("one or two small tickets go inline", () => {
  assert.equal(decide({ tickets: [T(1, "S")] }).path, "inline");
  assert.equal(decide({ tickets: [T(1, "S"), T(2, "M")] }).path, "inline");
});

test("three parallel tickets use the workflow", () => {
  assert.equal(decide({ tickets: [T(1), T(2), T(3)] }).path, "workflow");
});

test("two heavy tickets use the workflow, one XL does not", () => {
  assert.equal(decide({ tickets: [T(1, "L"), T(2, "L")] }).path, "workflow");
  assert.equal(decide({ tickets: [T(1, "XL"), T(2, "M")] }).path, "inline");
});

test("tickets under one ADR count once", () => {
  const same = { labels: ["adr:0059"] };
  assert.equal(parallelCount({ ready: [T(1, "M", same), T(2, "M", same), T(3)] }), 2);
  assert.equal(
    decide({ tickets: [T(1, "M", same), T(2, "M", same), T(3, "M", same)] }).path,
    "inline",
  );
});

test("blocked tickets and agent findings in Backlog do not count", () => {
  const tickets = [
    T(1),
    T(2),
    T(3, "M", { openBlockers: [1] }),
    T(4, "M", { status: "Backlog", labels: ["source:agent"] }),
  ];
  const d = decide({ tickets, statuses: ["Todo", "Backlog"] });
  assert.deepEqual(d.ready, [1, 2]);
  assert.equal(d.path, "inline");
});

test("small docs tickets are offered as one bundle", () => {
  const d = decide({
    tickets: [T(1, "XS", { kind: "Docs" }), T(2, "S", { kind: "Docs" }), T(3, "M")],
  });
  assert.deepEqual(d.bundle, [1, 2]);
});
