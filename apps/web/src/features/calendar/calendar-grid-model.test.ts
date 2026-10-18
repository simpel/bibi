import { describe, expect, it } from "vitest";
import type { CalendarBlock } from "./calendar-blocks";
import { blockLabel, type CalendarLabels } from "./calendar-grid-model";

const labels = {
  type: ({ type }) => type,
  reference: ({ reference }) => `Ticket ${reference}`,
  heldSince: ({ heldAt }) => `Held since ${heldAt.toISOString().slice(0, 10)}`,
} as CalendarLabels;

const base: CalendarBlock = {
  id: "a",
  itemId: "room",
  type: "HOLD",
  startsAt: new Date(0),
  endsAt: new Date(1),
  ticketId: "b1",
  reference: 12,
  title: "Lunch",
  soft: false,
  heldAt: null,
};

describe("block label", () => {
  it("names a ticket by reference and program item", () => {
    expect(blockLabel({ block: base, labels })).toBe("Ticket 12 · Lunch");
  });

  it("leads with the held-since date of a soft hold and the type of other rows", () => {
    const soft = { ...base, soft: true, heldAt: new Date("2026-10-03T09:00:00Z") };
    expect(blockLabel({ block: soft, labels })).toBe("Held since 2026-10-03 · Ticket 12 · Lunch");
    expect(blockLabel({ block: { ...base, type: "SETUP" }, labels })).toBe(
      "SETUP · Ticket 12 · Lunch",
    );
  });

  it("falls back to the type for a manual block without a note", () => {
    const manual = {
      ...base,
      type: "INTERNAL" as const,
      ticketId: null,
      reference: null,
      title: null,
    };
    expect(blockLabel({ block: manual, labels })).toBe("INTERNAL");
  });
});
