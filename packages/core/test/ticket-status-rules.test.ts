import { describe, expect, it } from "vitest";
import { statusBlockers } from "../src/features/ticket/status-rules";

const NONE = { requiresReason: false, requiresAssignee: false, requiresAcceptedQuote: false };
const open = { name: "Lead", closes: false, ...NONE };

describe("status blockers (ADR 0043)", () => {
  it("allows an allowed move into a status without requirements", () => {
    const to = { ...open, name: "Confirmed" };
    expect(statusBlockers({ from: open, to, allowed: true, assigneeId: null })).toEqual([]);
  });

  it("lists every blocker at once", () => {
    const to = {
      ...NONE,
      name: "Won",
      closes: false,
      requiresReason: true,
      requiresAssignee: true,
    };
    const blockers = statusBlockers({ from: open, to, allowed: false, assigneeId: null });
    expect(blockers.map((blocker) => blocker.path)).toEqual(["statusId", "reason", "assigneeId"]);
  });

  it("refuses any move out of a closing status", () => {
    const from = { ...open, name: "Lost", closes: true };
    const blockers = statusBlockers({ from, to: open, allowed: true, assigneeId: "u1" });
    expect(blockers).toEqual([
      { path: "statusId", message: '"Lost" is closing: no move leaves it' },
    ]);
  });

  it("is satisfied by a reason and an assignee", () => {
    const to = {
      ...NONE,
      name: "Won",
      closes: true,
      requiresReason: true,
      requiresAssignee: true,
    };
    const input = { from: open, to, allowed: true, assigneeId: "u1", reason: "Signed" };
    expect(statusBlockers(input)).toEqual([]);
  });

  it("guards the accepted-quote fact on entry (ADR 0054)", () => {
    const to = { ...open, name: "Confirmed", requiresAcceptedQuote: true };
    const input = { from: open, to, allowed: true, assigneeId: null };
    expect(statusBlockers(input)).toEqual([
      { path: "quote", message: '"Confirmed" requires an accepted quote (quote.accept)' },
    ]);
    expect(statusBlockers({ ...input, acceptedQuote: true })).toEqual([]);
  });
});
