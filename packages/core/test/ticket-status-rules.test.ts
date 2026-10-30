import { describe, expect, it } from "vitest";
import { statusBlockers } from "../src/features/ticket/status-rules";

const open = { name: "Lead", closes: false };
const won = { name: "Won", closes: false };

describe("status blockers (ADR 0043, 0067)", () => {
  it("allows an allowed move along a transition without gates", () => {
    const to = { ...open, name: "Confirmed" };
    const input = { from: open, to, allowed: true, gates: [], assigneeId: null };
    expect(statusBlockers(input)).toEqual([]);
  });

  it("lists every blocker at once", () => {
    const gates = ["REASON", "ASSIGNEE"] as const;
    const blockers = statusBlockers({
      from: open,
      to: won,
      allowed: false,
      gates,
      assigneeId: null,
    });
    expect(blockers.map((blocker) => blocker.path)).toEqual(["statusId", "reason", "assigneeId"]);
  });

  it("refuses any move out of a closing status", () => {
    const from = { ...open, name: "Lost", closes: true };
    const blockers = statusBlockers({ from, to: open, allowed: true, gates: [], assigneeId: "u1" });
    expect(blockers).toEqual([
      { path: "statusId", message: '"Lost" is closing: no move leaves it' },
    ]);
  });

  it("is satisfied by a reason and an assignee", () => {
    const gates = ["REASON", "ASSIGNEE"] as const;
    const input = { from: open, to: won, allowed: true, gates, assigneeId: "u1", reason: "Signed" };
    expect(statusBlockers(input)).toEqual([]);
  });

  it("guards the accepted-quote fact on the transition (ADR 0054)", () => {
    const to = { ...open, name: "Confirmed" };
    const gates = ["ACCEPTED_QUOTE"] as const;
    const input = { from: open, to, allowed: true, gates, assigneeId: null };
    expect(statusBlockers(input)).toEqual([
      {
        path: "quote",
        message: 'The move from "Lead" to "Confirmed" requires an accepted quote (quote.accept)',
      },
    ]);
    expect(statusBlockers({ ...input, acceptedQuote: true })).toEqual([]);
  });
});
