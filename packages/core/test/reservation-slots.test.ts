import { describe, expect, it } from "vitest";
import { pickTables, type TableUnit } from "../src/features/reservation/assign";
import {
  candidateStarts,
  inOnlineWindow,
  type SittingRule,
  turnMinutes,
} from "../src/features/reservation/slots";

const DINNER: SittingRule = {
  id: "dinner",
  layoutId: "layout",
  weekdays: [4], // Friday
  firstStartMinute: 17 * 60,
  lastStartMinute: 18 * 60,
  slotMinutes: 30,
  turnTimes: [
    { upToParty: 2, minutes: 90 },
    { upToParty: 4, minutes: 120 },
  ],
  maxCoversPerSlot: 24,
  validFrom: null,
  validUntil: null,
};
const FRIDAY = { year: 2026, month: 12, day: 4 };
const ZONE = "Europe/Stockholm";

describe("bookable starts of a sitting (ADR 0119)", () => {
  it("lists the slots on its weekdays in the room's zone, with the party's turn time", () => {
    const starts = candidateStarts({
      ...{ date: FRIDAY, timeZone: ZONE, sitting: DINNER, override: null },
      partySize: 3,
    });
    expect(starts.map((s) => s.startsAt.toISOString())).toEqual([
      "2026-12-04T16:00:00.000Z",
      "2026-12-04T16:30:00.000Z",
      "2026-12-04T17:00:00.000Z",
    ]);
    expect(starts[0]?.endsAt.toISOString()).toBe("2026-12-04T18:00:00.000Z");
    const saturday = { year: 2026, month: 12, day: 5 };
    expect(
      candidateStarts({
        date: saturday,
        timeZone: ZONE,
        sitting: DINNER,
        override: null,
        partySize: 2,
      }),
    ).toEqual([]);
  });

  it("follows the day's exception and the season", () => {
    const base = { date: FRIDAY, timeZone: ZONE, sitting: DINNER, partySize: 2 };
    const closed = {
      closed: true,
      firstStartMinute: null,
      lastStartMinute: null,
      layoutId: null,
      maxCoversPerSlot: null,
    };
    expect(candidateStarts({ ...base, override: closed })).toEqual([]);
    const late = {
      ...closed,
      closed: false,
      firstStartMinute: 20 * 60,
      lastStartMinute: 20 * 60,
      layoutId: "xmas",
    };
    expect(candidateStarts({ ...base, override: late })).toMatchObject([
      { layoutId: "xmas", startsAt: new Date("2026-12-04T19:00:00.000Z") },
    ]);
    const ended = { ...DINNER, validUntil: new Date("2026-12-04T16:15:00.000Z") };
    expect(candidateStarts({ ...base, sitting: ended, override: null })).toHaveLength(1);
  });

  it("uses the last turn time for larger parties and checks the online window", () => {
    expect(turnMinutes({ turnTimes: DINNER.turnTimes, partySize: 9 })).toBe(120);
    const rule = { minMinutesAhead: 120, maxDaysAhead: 30, maxOnlineParty: 8 };
    const now = new Date("2026-12-04T12:00:00.000Z");
    const at = ({ iso }: { iso: string }) => new Date(iso);
    const window = ({ startsAt, extra = {} }: { startsAt: Date; extra?: object }) =>
      inOnlineWindow({ startsAt, now, rule, openUntil: null, partySize: 2, ...extra });
    expect(window({ startsAt: at({ iso: "2026-12-04T13:00:00.000Z" }) })).toBe(false);
    expect(window({ startsAt: at({ iso: "2026-12-04T16:00:00.000Z" }) })).toBe(true);
    expect(window({ startsAt: at({ iso: "2027-02-01T16:00:00.000Z" }) })).toBe(false);
    expect(
      window({ startsAt: at({ iso: "2026-12-04T16:00:00.000Z" }), extra: { partySize: 9 } }),
    ).toBe(false);
    expect(
      window({
        startsAt: at({ iso: "2026-12-10T16:00:00.000Z" }),
        extra: { openUntil: at({ iso: "2026-12-08T00:00:00.000Z" }) },
      }),
    ).toBe(false);
  });
});

const table = ({
  id,
  max,
  extra = {},
}: {
  id: string;
  max: number;
  extra?: Partial<TableUnit>;
}): TableUnit => ({
  ...{ id, label: id, maxCovers: max, minCovers: 1, onlineBookable: true },
  ...extra,
});
const SPAN = {
  startsAt: new Date("2026-12-04T17:00:00Z"),
  endsAt: new Date("2026-12-04T19:00:00Z"),
};

describe("picking tables (ADR 0119)", () => {
  const tables = [
    table({ id: "10", max: 6 }),
    table({ id: "2", max: 2 }),
    table({ id: "3", max: 2 }),
    table({ id: "7", max: 4 }),
    table({ id: "8", max: 4 }),
  ];
  const long = {
    id: "long",
    elementIds: ["7", "8"],
    minCovers: 6,
    maxCovers: 8,
    onlineBookable: true,
  };
  const pick = ({
    ...input
  }: {
    partySize: number;
    busy?: Map<string, never[]>;
    online?: boolean;
  }) =>
    pickTables({
      tables,
      combinations: [long],
      busy: input.busy ?? new Map(),
      partySize: input.partySize,
      online: input.online ?? true,
      ...SPAN,
    });

  it("takes the smallest free table, lowest number first", () => {
    expect(pick({ partySize: 2 })).toEqual(["2"]);
    expect(pick({ partySize: 3 })).toEqual(["7"]);
  });

  it("falls back to a combination and skips busy tables", () => {
    const busy = new Map([["10", [{ ...SPAN, kind: "RESERVATION" as const }]]]);
    expect(
      pickTables({ tables, combinations: [long], busy, partySize: 7, online: true, ...SPAN }),
    ).toEqual(["7", "8"]);
    const all = new Map([
      ["10", [{ ...SPAN, kind: "RESERVATION" as const }]],
      ["8", [{ ...SPAN, kind: "BLOCK" as const }]],
    ]);
    expect(
      pickTables({ tables, combinations: [long], busy: all, partySize: 7, online: true, ...SPAN }),
    ).toBeNull();
  });

  it("keeps online-only tables and blocks for staff", () => {
    const walkIn = [table({ id: "11", max: 2, extra: { onlineBookable: false } })];
    const input = { combinations: [], busy: new Map(), partySize: 2, ...SPAN };
    expect(pickTables({ ...input, tables: walkIn, online: true })).toBeNull();
    expect(pickTables({ ...input, tables: walkIn, online: false })).toEqual(["11"]);
    const kept = new Map([["2", [{ ...SPAN, kind: "ONLINE_ONLY" as const }]]]);
    const two = [table({ id: "2", max: 2 })];
    expect(pickTables({ ...input, tables: two, busy: kept, online: true })).toBeNull();
    expect(pickTables({ ...input, tables: two, busy: kept, online: false })).toEqual(["2"]);
  });
});
