import assert from "node:assert/strict";
import { test } from "node:test";
import { profile } from "./model.mjs";
import { choose, rank, whyNot } from "./pick-rules.mjs";

const ticket = (over) => ({
  number: 1,
  title: "Do a thing",
  status: "Todo",
  priority: "P1",
  size: "M",
  kind: "Feature",
  model: "",
  effort: "",
  labels: [],
  openBlockers: [],
  ...over,
});

test("rank puts priority first, then smaller size, then the older issue", () => {
  const order = rank({
    tickets: [
      ticket({ number: 5, priority: "P2", size: "XS" }),
      ticket({ number: 4, priority: "P1", size: "L" }),
      ticket({ number: 3, priority: "P1", size: "S" }),
      ticket({ number: 2, priority: "P1", size: "S" }),
      ticket({ number: 1, priority: "", size: "XS" }),
    ],
  }).map((t) => t.number);
  assert.deepEqual(order, [2, 3, 4, 5, 1]);
});

test("whyNot refuses blocked, agent-sourced, claimed and clashing tickets", () => {
  const inflight = [{ number: 9, labels: ["area:web"], schema: false }];
  assert.match(whyNot({ ticket: ticket({ openBlockers: [7] }), inflight }), /blocked by #7/);
  assert.equal(whyNot({ ticket: ticket({ labels: ["source:agent"] }), inflight }), "source:agent");
  assert.match(whyNot({ ticket: ticket({ number: 9 }), inflight }), /claimed/);
  assert.match(whyNot({ ticket: ticket({ labels: ["area:web"] }), inflight }), /#9/);
  assert.equal(whyNot({ ticket: ticket({ labels: ["area:ui"] }), inflight }), null);
});

test("only one schema change is in flight", () => {
  const inflight = [{ number: 9, labels: ["area:core"], schema: true }];
  assert.match(whyNot({ ticket: ticket({ labels: ["area:db"] }), inflight }), /schema/);
  assert.equal(whyNot({ ticket: ticket({ labels: ["area:web"] }), inflight }), null);
});

test("choose skips to the first ready ticket and reports why the others were skipped", () => {
  const { ticket: picked, skipped } = choose({
    tickets: [ticket({ number: 1, openBlockers: [3] }), ticket({ number: 2, priority: "P2" })],
    inflight: [],
  });
  assert.equal(picked.number, 2);
  assert.deepEqual(skipped, [{ number: 1, reason: "blocked by #3" }]);
});

test("profile follows the board fields and falls back to the default rules", () => {
  assert.deepEqual(profile({ ticket: ticket({}) }), {
    model: "sonnet",
    effort: "medium",
    skill: "new-feature",
    budgetUsd: 8,
  });
  const risky = profile({ ticket: ticket({ size: "S", labels: ["area:db"] }) });
  assert.equal(risky.model, "opus");
  assert.equal(risky.effort, "high");
  assert.equal(profile({ ticket: ticket({ model: "Haiku", size: "L" }) }).model, "haiku");
  assert.equal(profile({ ticket: ticket({ kind: "Bugfix" }) }).skill, "fix-bug");
  assert.equal(profile({ ticket: ticket({ kind: "Docs", effort: "" }) }).effort, "low");
  assert.equal(profile({ ticket: ticket({ effort: "Extra" }) }).effort, "xhigh");
});
