import { describe, expect, it } from "vitest";
import type { CalendarBlock } from "./calendar-blocks";
import { blockLabel, type CalendarLabels } from "./calendar-grid-model";

const labels = {
  type: ({ type }) => type,
  reference: ({ reference }) => `Ticket ${reference}`,
  option: ({ position }) => `Option ${position}`,
} as CalendarLabels;

const base: CalendarBlock = {
  id: "a",
  itemId: "room",
  type: "BOOKING",
  startsAt: new Date(0),
  endsAt: new Date(1),
  ticketId: "b1",
  reference: 12,
  title: "Lunch",
  queuePosition: null,
};

describe("block label", () => {
  it("names a ticket by reference and program item", () => {
    expect(blockLabel({ block: base, labels })).toBe("Ticket 12 · Lunch");
  });

  it("leads with the queue position of an option and the type of other rows", () => {
    expect(blockLabel({ block: { ...base, type: "OPTION", queuePosition: 2 }, labels })).toBe(
      "Option 2 · Ticket 12 · Lunch",
    );
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
