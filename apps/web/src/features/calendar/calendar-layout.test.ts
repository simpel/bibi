import type { CalendarBlockDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { calendarColumns, placeBlocks } from "./calendar-layout";
import { type CalendarView, periodDays, periodFor, readPlainDate } from "./calendar-period";
import { assignLanes } from "./lanes";

const TZ = "Europe/Stockholm";

type GridInput = { view: Extract<CalendarView, "day" | "week">; date: string };

const columnsOf = ({ view, date }: GridInput) => {
  const anchor = readPlainDate({ value: date });
  if (!anchor) throw new Error(`bad date ${date}`);
  return calendarColumns({
    view,
    days: periodDays({ period: periodFor({ view, anchor }) }),
    timeZone: TZ,
  });
};

type BlockInput = { id: string; start: string; end: string };

const block = ({ id, start, end }: BlockInput): CalendarBlockDto => ({
  id,
  itemId: "room",
  type: "HOLD",
  startsAt: new Date(start),
  endsAt: new Date(end),
  ticketId: null,
  reference: null,
  title: null,
  soft: false,
  heldAt: null,
  stateId: null,
  stateName: null,
  stateColor: null,
  statusId: null,
  expiresAt: null,
});

describe("calendar layout", () => {
  it("places a day-view block in its starting hour with offset and span", () => {
    const columns = columnsOf({ view: "day", date: "2026-10-15" });
    expect(columns).toHaveLength(24);
    // 09:30–11:00 Stockholm (UTC+2)
    const placed = placeBlocks({
      columns,
      blocks: [block({ id: "a", start: "2026-10-15T07:30:00Z", end: "2026-10-15T09:00:00Z" })],
      view: "day",
    });
    expect(placed[9]).toEqual([expect.objectContaining({ offset: 0.5, span: 1.5 })]);
  });

  it("clips a block that started the day before to midnight", () => {
    const columns = columnsOf({ view: "day", date: "2026-10-15" });
    const placed = placeBlocks({
      columns,
      blocks: [block({ id: "a", start: "2026-10-14T20:00:00Z", end: "2026-10-14T23:00:00Z" })],
      view: "day",
    });
    expect(placed[0]).toEqual([expect.objectContaining({ offset: 0, span: 1 })]);
  });

  it("shows a multi-day block on every day it touches in the week view", () => {
    const columns = columnsOf({ view: "week", date: "2026-10-15" });
    const placed = placeBlocks({
      columns,
      blocks: [block({ id: "a", start: "2026-10-13T10:00:00Z", end: "2026-10-14T10:00:00Z" })],
      view: "week",
    });
    expect(placed.map((cell) => cell.length)).toEqual([0, 1, 1, 0, 0, 0, 0]);
  });

  it("has 23 hour columns on the spring DST day and 25 on the autumn one", () => {
    for (const [date, hours] of [
      ["2026-03-29", 23],
      ["2026-10-25", 25],
    ] as const) {
      const columns = columnsOf({ view: "day", date });
      expect(columns).toHaveLength(hours);
      for (const column of columns) {
        expect(column.end.getTime() - column.start.getTime()).toBe(3_600_000);
      }
    }
  });

  it("labels the repeated autumn hour twice and skips the spring one", () => {
    const hours = ({ date }: { date: string }) =>
      columnsOf({ view: "day", date }).map((column) => column.hour);
    expect(hours({ date: "2026-10-25" }).slice(0, 5)).toEqual([0, 1, 2, 2, 3]);
    expect(hours({ date: "2026-03-29" }).slice(0, 4)).toEqual([0, 1, 3, 4]);
  });

  it("draws a block over midnight as one block clipped to each day", () => {
    // 22:00 on 15 Oct to 02:00 on 16 Oct, Stockholm (UTC+2)
    const overnight = block({
      id: "a",
      start: "2026-10-15T20:00:00Z",
      end: "2026-10-16T00:00:00Z",
    });
    const place = ({ date }: { date: string }) =>
      placeBlocks({ columns: columnsOf({ view: "day", date }), blocks: [overnight], view: "day" });
    expect(place({ date: "2026-10-15" })[22]).toEqual([
      expect.objectContaining({ offset: 0, span: 2 }),
    ]);
    expect(place({ date: "2026-10-16" })[0]).toEqual([
      expect.objectContaining({ offset: 0, span: 2 }),
    ]);
    const week = placeBlocks({
      columns: columnsOf({ view: "week", date: "2026-10-15" }),
      blocks: [overnight],
      view: "week",
    });
    expect(week.map((cell) => cell.length)).toEqual([0, 0, 0, 1, 1, 0, 0]);
  });

  it("puts overlapping blocks in separate lanes", () => {
    const { lanes, count } = assignLanes({
      blocks: [
        block({ id: "a", start: "2026-10-15T08:00:00Z", end: "2026-10-15T10:00:00Z" }),
        block({ id: "b", start: "2026-10-15T09:00:00Z", end: "2026-10-15T11:00:00Z" }),
        block({ id: "c", start: "2026-10-15T10:00:00Z", end: "2026-10-15T12:00:00Z" }),
      ],
    });
    expect(Object.fromEntries(lanes)).toEqual({ a: 0, b: 1, c: 0 });
    expect(count).toBe(2);
  });
});
