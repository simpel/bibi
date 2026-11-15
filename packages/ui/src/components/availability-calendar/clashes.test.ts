import { describe, expect, it } from "vitest";
import type { CalendarLine, CalendarWindow } from "./calendar-types";
import { freeSlotAt, freeSpanAt, markBlocked } from "./clashes";

const WINDOW: CalendarWindow = { from: 480, to: 1080 };

function line({
  id = "a",
  start,
  end,
  setupMinutes = 0,
  teardownMinutes = 0,
}: {
  id?: string;
  start: string;
  end: string;
  setupMinutes?: number;
  teardownMinutes?: number;
}): CalendarLine {
  return {
    id,
    name: id,
    type: "Room",
    place: null,
    start,
    end,
    setupMinutes,
    teardownMinutes,
    state: { name: "Booked", color: "#000", ink: "#fff", hold: "hard" },
    quantity: 1,
  };
}

describe("freeSlotAt", () => {
  it("offers up to an hour from a free start, stopped by the next line", () => {
    const lines = [line({ start: "09:45", end: "11:00" })];
    expect(freeSlotAt({ lines, from: 540, window: WINDOW })).toEqual({ from: 540, to: 585 });
    expect(freeSlotAt({ lines, from: 600, window: WINDOW })).toBeNull();
  });
});

describe("freeSpanAt", () => {
  it("stretches right from the anchor in 30-minute steps", () => {
    expect(freeSpanAt({ lines: [], anchor: 540, target: 660, window: WINDOW })).toEqual({
      from: 540,
      to: 690,
    });
  });

  it("stretches left from the anchor in 30-minute steps", () => {
    expect(freeSpanAt({ lines: [], anchor: 540, target: 480, window: WINDOW })).toEqual({
      from: 480,
      to: 570,
    });
  });

  it("stops at adjacent booking footprints in both directions", () => {
    const lines = [
      line({ id: "morning", start: "09:00", end: "10:00", teardownMinutes: 15 }),
      line({ id: "afternoon", start: "13:00", end: "14:00", setupMinutes: 15 }),
    ];
    expect(freeSpanAt({ lines, anchor: 660, target: 480, window: WINDOW })).toEqual({
      from: 615,
      to: 690,
    });
    expect(freeSpanAt({ lines, anchor: 660, target: 900, window: WINDOW })).toEqual({
      from: 660,
      to: 765,
    });
  });

  it("returns null when anchored inside an existing booking", () => {
    const lines = [line({ start: "09:00", end: "10:00" })];
    expect(freeSpanAt({ lines, anchor: 540, target: 660, window: WINDOW })).toBeNull();
  });
});

describe("markBlocked (ADR 0044)", () => {
  const soft = ({ id, start, end }: { id: string; start: string; end: string }): CalendarLine => {
    const base = line({ id, start, end });
    return { ...base, state: { ...base.state, name: "Prebooked", hold: "soft" } };
  };

  it("blocks a soft hold a hard hold overlaps, and only that", () => {
    const lines = [
      line({ id: "hard", start: "09:00", end: "13:00" }),
      soft({ id: "under", start: "10:00", end: "12:00" }),
      soft({ id: "after", start: "13:00", end: "14:00" }),
    ];
    expect(markBlocked({ lines }).map((l) => [l.id, Boolean(l.blocked)])).toEqual([
      ["hard", false],
      ["under", true],
      ["after", false],
    ]);
  });

  it("never blocks soft holds that only overlap each other", () => {
    const lines = [
      soft({ id: "a", start: "10:00", end: "12:00" }),
      soft({ id: "b", start: "11:00", end: "13:00" }),
    ];
    expect(markBlocked({ lines }).some((l) => l.blocked)).toBe(false);
  });
});
