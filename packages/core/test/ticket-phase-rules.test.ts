import { describe, expect, it } from "vitest";
import { phaseBlockers } from "../src/features/ticket/phase-rules";

const open = { name: "Lead", terminal: false, requiresReason: false, requiresAssignee: false };

describe("phase blockers (ADR 0043)", () => {
  it("allows an allowed move into a phase without requirements", () => {
    const to = { ...open, name: "Confirmed" };
    expect(phaseBlockers({ from: open, to, allowed: true, assigneeId: null })).toEqual([]);
  });

  it("lists every blocker at once", () => {
    const to = { name: "Won", terminal: false, requiresReason: true, requiresAssignee: true };
    const blockers = phaseBlockers({ from: open, to, allowed: false, assigneeId: null });
    expect(blockers.map((blocker) => blocker.path)).toEqual(["phaseId", "reason", "assigneeId"]);
  });

  it("refuses any move out of a terminal phase", () => {
    const from = { ...open, name: "Lost", terminal: true };
    const blockers = phaseBlockers({ from, to: open, allowed: true, assigneeId: "u1" });
    expect(blockers).toEqual([
      { path: "phaseId", message: '"Lost" is terminal: no move leaves it' },
    ]);
  });

  it("is satisfied by a reason and an assignee", () => {
    const to = { name: "Won", terminal: true, requiresReason: true, requiresAssignee: true };
    const input = { from: open, to, allowed: true, assigneeId: "u1", reason: "Signed" };
    expect(phaseBlockers(input)).toEqual([]);
  });
});
