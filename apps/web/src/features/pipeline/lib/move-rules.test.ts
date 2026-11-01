import type { PipelineCard, PipelineStatus } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { canMoveCard, dropTargets } from "./move-rules";

const card = ({ overrides = {} }: { overrides?: Partial<PipelineCard> } = {}): PipelineCard => ({
  id: "t1",
  columnId: "open",
  statusId: "lead",
  reference: 1,
  typeName: "Conference",
  customerId: "c1",
  startsAt: null,
  endsAt: null,
  quantity: 10,
  statusChangedAt: new Date("2026-10-01T08:00:00Z"),
  assigneeId: null,
  heldLines: 0,
  bookedLines: 0,
  ...overrides,
});

const status = ({
  overrides = {},
}: {
  overrides?: Partial<PipelineStatus>;
} = {}): PipelineStatus => ({
  id: "lead",
  title: "Lead",
  color: "#f59e0b",
  closed: false,
  ...overrides,
});

const lead = status();
const confirmed = status({ overrides: { id: "confirmed", title: "Confirmed" } });
const locked = status({ overrides: { id: "locked", title: "Final count locked" } });
const lost = status({
  overrides: { id: "lost", title: "Lost", closed: true },
});
const completed = status({ overrides: { id: "completed", title: "Completed", closed: true } });
const transitions = {
  lead: ["confirmed", "lost", "completed"],
  confirmed: ["locked", "completed"],
};
// "Won" groups two statuses: a drop on it picks one of them (ADR 0076).
const won = { id: "won", statuses: [confirmed, locked] };
const closedColumn = { id: "closed", statuses: [completed, lost] };

describe("pipeline move rules (ADR 0041, 0043, 0067)", () => {
  it("allows the organization's transitions", () => {
    expect(canMoveCard({ card: card(), from: lead, to: confirmed, transitions })).toBe(true);
    expect(canMoveCard({ card: card(), from: lead, to: completed, transitions })).toBe(true);
  });

  it("allows a move to another status of the same column", () => {
    const inWon = card({ overrides: { columnId: "won", statusId: "confirmed" } });
    expect(canMoveCard({ card: inWon, from: confirmed, to: locked, transitions })).toBe(true);
  });

  it("refuses moves the organization does not allow", () => {
    const back = {
      card: card({ overrides: { columnId: "won", statusId: "confirmed" } }),
      from: confirmed,
      to: lead,
      transitions,
    };
    expect(canMoveCard(back)).toBe(false);
    expect(canMoveCard({ card: card(), from: lead, to: locked, transitions })).toBe(false);
  });

  it("accepts the drop on a status that needs a reason (a dialog asks for it)", () => {
    expect(canMoveCard({ card: card(), from: lead, to: lost, transitions })).toBe(true);
  });

  it("never moves a card out of a closed status or onto its own status", () => {
    const closed = {
      card: card({ overrides: { columnId: "closed", statusId: "completed" } }),
      from: completed,
      to: lead,
      transitions,
    };
    expect(canMoveCard(closed)).toBe(false);
    expect(canMoveCard({ card: card(), from: lead, to: lead, transitions })).toBe(false);
  });

  it("lists the statuses of the drop column the card may move to", () => {
    const base = { card: card(), from: lead, transitions };
    expect(dropTargets({ ...base, statuses: closedColumn.statuses })).toEqual([completed, lost]);
    expect(dropTargets({ ...base, statuses: won.statuses })).toEqual([confirmed]);
    expect(dropTargets({ ...base, statuses: [lead] })).toEqual([]);
    expect(dropTargets({ ...base, statuses: [] })).toEqual([]);
  });

  it("never offers the card's own status, nor any status from a closed one", () => {
    const inWon = card({ overrides: { columnId: "won", statusId: "confirmed" } });
    const own = dropTargets({ card: inWon, from: confirmed, statuses: won.statuses, transitions });
    expect(own).toEqual([locked]);
    const done = card({ overrides: { columnId: "closed", statusId: "completed" } });
    expect(
      dropTargets({ card: done, from: completed, statuses: won.statuses, transitions }),
    ).toEqual([]);
  });
});
