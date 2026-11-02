import type { CalendarBlockDto } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { ticketDayOf } from "./ticket-day-model";

const midnight = new Date("2037-11-01T00:00:00.000Z");
const at = ({ hour }: { hour: number }) => new Date(Date.UTC(2037, 10, 1, hour));

const block = ({ ...over }: Partial<CalendarBlockDto>) =>
  ({
    ...{ id: "b", itemId: "room", ticketId: "other", reference: 41, soft: false },
    ...{ allocated: false, title: null, details: null },
    ...{ startsAt: at({ hour: 8 }), endsAt: at({ hour: 10 }) },
    ...over,
  }) as CalendarBlockDto;

const base = {
  ticketId: "mine",
  midnight,
  itemNames: new Map([
    ["room", "Vinga"],
    ["hall", "Asperö"],
  ]),
  blockLabel: ({ block: { reference } }: { block: CalendarBlockDto }) => `#${reference}`,
  otherLabel: "Other lines",
};

describe("ticketDayOf", () => {
  it("shows the whole day: its items first, every other booked item dimmed, own holds left out", () => {
    const lines = [
      {
        id: "l1",
        name: "Session",
        itemId: "room",
        startsAt: at({ hour: 10 }),
        endsAt: at({ hour: 12 }),
      },
      {
        id: "l2",
        name: "Buffet",
        itemId: null,
        startsAt: at({ hour: 12 }),
        endsAt: at({ hour: 13 }),
      },
    ];
    const blocks = [
      block({ id: "other-hard" }),
      block({ id: "other-soft", soft: true, startsAt: at({ hour: 14 }), endsAt: at({ hour: 15 }) }),
      block({
        id: "own-hold",
        ticketId: "mine",
        startsAt: at({ hour: 10 }),
        endsAt: at({ hour: 12 }),
      }),
      block({ id: "next-day", startsAt: at({ hour: 30 }), endsAt: at({ hour: 31 }) }),
      block({ id: "elsewhere", itemId: "hall" }),
    ];
    const day = ticketDayOf({ ...base, lines, blocks });
    expect(day).toMatchObject({ startMinute: 8 * 60, endMinute: 20 * 60 });
    expect(
      day.rows.map(({ id, blocks: bars }) => [id, bars.map((bar) => [bar.id, bar.tone])]),
    ).toEqual([
      [
        "room",
        [
          ["other-hard", "hard"],
          ["other-soft", "soft"],
          ["line-l1", "own"],
        ],
      ],
      ["hall", [["elsewhere", "hard"]]],
      ["other", [["line-l2", "own"]]],
    ]);
  });

  it("widens the window to a line past midnight", () => {
    const lines = [
      {
        id: "l",
        name: "Party",
        itemId: "room",
        startsAt: at({ hour: 22 }),
        endsAt: at({ hour: 25 }),
      },
    ];
    expect(ticketDayOf({ ...base, lines, blocks: [] }).endMinute).toBe(25 * 60);
  });

  it("lists the lines without a time", () => {
    const lines = [{ id: "l", name: "Lunch", itemId: null, startsAt: null, endsAt: null }];
    expect(ticketDayOf({ ...base, lines, blocks: [] })).toMatchObject({
      rows: [],
      untimed: ["Lunch"],
    });
  });
});
