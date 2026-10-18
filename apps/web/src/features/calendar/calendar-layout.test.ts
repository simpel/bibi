import { describe, expect, it } from "vitest";
import type { CalendarBlock } from "./calendar-blocks";
import { calendarColumns, placeBlocks } from "./calendar-layout";
import { readCalendarParams } from "./calendar-params";
import { assignLanes } from "./lanes";

const TZ = "Europe/Stockholm";
const now = new Date("2026-10-15T10:00:00Z");

type BlockInput = { id: string; start: string; end: string };

const block = ({ id, start, end }: BlockInput): CalendarBlock => ({
  id,
  itemId: "room",
  type: "BOOKING",
  startsAt: new Date(start),
  endsAt: new Date(end),
  ticketId: null,
  reference: null,
  title: null,
  queuePosition: null,
});

describe("calendar layout", () => {
  it("places a day-view block in its starting hour with offset and span", () => {
    const params = readCalendarParams({ raw: { date: "2026-10-15" }, now, timeZone: TZ });
    const columns = calendarColumns({ params, timeZone: TZ });
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
    const params = readCalendarParams({ raw: { date: "2026-10-15" }, now, timeZone: TZ });
    const columns = calendarColumns({ params, timeZone: TZ });
    const placed = placeBlocks({
      columns,
      blocks: [block({ id: "a", start: "2026-10-14T20:00:00Z", end: "2026-10-14T23:00:00Z" })],
      view: "day",
    });
    expect(placed[0]).toEqual([expect.objectContaining({ offset: 0, span: 1 })]);
  });

  it("shows a multi-day block on every day it touches in the week view", () => {
    const params = readCalendarParams({
      raw: { view: "week", date: "2026-10-15" },
      now,
      timeZone: TZ,
    });
    const columns = calendarColumns({ params, timeZone: TZ });
    const placed = placeBlocks({
      columns,
      blocks: [block({ id: "a", start: "2026-10-13T10:00:00Z", end: "2026-10-14T10:00:00Z" })],
      view: "week",
    });
    expect(placed.map((cell) => cell.length)).toEqual([0, 1, 1, 0, 0, 0, 0]);
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
