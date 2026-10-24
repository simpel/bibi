import type { PipelineCard, PipelineColumn } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { canMoveCard } from "./move-rules";

const card = ({ overrides = {} }: { overrides?: Partial<PipelineCard> } = {}): PipelineCard => ({
  id: "t1",
  columnId: "lead",
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

const column = ({
  overrides = {},
}: {
  overrides?: Partial<PipelineColumn>;
} = {}): PipelineColumn => ({
  id: "lead",
  title: "Lead",
  color: "#f59e0b",
  requiresReason: false,
  closed: false,
  ...overrides,
});

const lead = column();
const confirmed = column({ overrides: { id: "confirmed", title: "Confirmed" } });
const lost = column({
  overrides: { id: "lost", title: "Lost", closed: true, requiresReason: true },
});
const completed = column({ overrides: { id: "completed", title: "Completed", closed: true } });
const transitions = { lead: ["confirmed", "lost", "completed"], confirmed: ["completed"] };

describe("pipeline move rules (ADR 0041, 0043)", () => {
  it("allows the organization's transitions", () => {
    expect(canMoveCard({ card: card(), from: lead, to: confirmed, transitions })).toBe(true);
    expect(canMoveCard({ card: card(), from: lead, to: completed, transitions })).toBe(true);
  });

  it("refuses moves the organization does not allow", () => {
    const back = {
      card: card({ overrides: { columnId: "confirmed" } }),
      from: confirmed,
      to: lead,
      transitions,
    };
    expect(canMoveCard(back)).toBe(false);
  });

  it("accepts the drop on a status that needs a reason (a dialog asks for it)", () => {
    expect(canMoveCard({ card: card(), from: lead, to: lost, transitions })).toBe(true);
  });

  it("never moves a card out of a closed lane or onto its own lane", () => {
    const closed = {
      card: card({ overrides: { columnId: "completed" } }),
      from: completed,
      to: lead,
      transitions,
    };
    expect(canMoveCard(closed)).toBe(false);
    expect(canMoveCard({ card: card(), from: lead, to: lead, transitions })).toBe(false);
  });
});
