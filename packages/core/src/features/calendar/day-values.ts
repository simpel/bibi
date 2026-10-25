import { type HoursLookup, type Interval, openIntervals } from "../../hours/within-hours";
import { parseIsoDate } from "../../time/plain-date";
import { freeTime, overlapMs } from "./free-time";
import type { CalendarBlockDto } from "./schema";
import type { CalendarDayValue } from "./value-schema";

/** A local day of the range as instants, `[from, to)`. */
export type RangeDay = Interval & { date: string };

/** A bookable item with an hourly list price (ADR 0021 `PRICED`): a room, not its equipment. */
export type PricedItem = {
  id: string;
  /** Per hour. */
  priceMinor: number;
  /** Its own hours, else its venue's (ADR 0064 rule 10). */
  hours: HoursLookup;
  timeZone: string;
};

type Sums = { booked: number; prebooked: number; open: number };

export type DayValuesInput = {
  days: readonly RangeDay[];
  blocks: readonly CalendarBlockDto[];
  items: readonly PricedItem[];
  /** program:read: the lines' values are visible. */
  lines: boolean;
  /** item:read and no line filter: the open time can be priced. */
  open: boolean;
};

const keyOf = ({ itemId, date }: { itemId: string; date: string }) => `${itemId}|${date}`;
const spanOf = ({ block }: { block: CalendarBlockDto }): Interval => ({
  from: block.startsAt.getTime(),
  to: block.endsAt.getTime(),
});

type Add = (input: { itemId: string; date: string; part: keyof Sums; minor: number }) => void;

/** Each line's value on its own item, split over the days its hold covers (ADR 0052, 0053). */
function addLines({ days, blocks, add }: Pick<DayValuesInput, "days" | "blocks"> & { add: Add }) {
  for (const block of blocks) {
    const value = block.details?.valueMinor;
    if (block.type !== "HOLD" || block.allocated || value === null || value === undefined) continue;
    const span = spanOf({ block });
    const length = Math.max(1, span.to - span.from);
    for (const day of days) {
      const share = overlapMs({ a: span, b: day }) / length;
      if (share === 0) continue;
      const part = block.soft ? "prebooked" : "booked";
      add({ itemId: block.itemId, date: day.date, part, minor: value * share });
    }
  }
}

/** What the item's free time within its hours that day sells for at its hourly price. */
function openValueOf({ item, day, taken }: { item: PricedItem; day: RangeDay; taken: Interval[] }) {
  const local = openIntervals({ ...item, date: parseIsoDate({ value: day.date }) });
  const open = local.flatMap((span) => {
    const from = Math.max(span.from, day.from);
    const to = Math.min(span.to, day.to);
    return to > from ? [{ from, to }] : [];
  });
  return (freeTime({ open, taken }) / 3_600_000) * item.priceMinor;
}

/** Every item and day with any value: booked, prebooked and still open (excl. VAT, minor). */
export function dayValues({ ...input }: DayValuesInput): CalendarDayValue[] {
  const sums = new Map<string, Sums>();
  const add: Add = ({ itemId, date, part, minor }) => {
    const key = keyOf({ itemId, date });
    const own = sums.get(key) ?? { booked: 0, prebooked: 0, open: 0 };
    own[part] += minor;
    sums.set(key, own);
  };
  if (input.lines) addLines({ ...input, add });
  if (input.open) {
    for (const item of input.items) {
      const taken = input.blocks
        .filter((block) => block.itemId === item.id)
        .map((block) => spanOf({ block }));
      for (const day of input.days) {
        add({
          itemId: item.id,
          date: day.date,
          part: "open",
          minor: openValueOf({ item, day, taken }),
        });
      }
    }
  }
  return [...sums].flatMap(([key, sum]) => {
    const [itemId = "", date = ""] = key.split("|");
    if (sum.booked + sum.prebooked + sum.open === 0) return [];
    const lines = ({ minor }: { minor: number }) => (input.lines ? Math.round(minor) : null);
    return [
      {
        itemId,
        date,
        bookedMinor: lines({ minor: sum.booked }),
        prebookedMinor: lines({ minor: sum.prebooked }),
        openMinor: input.open ? Math.round(sum.open) : null,
      },
    ];
  });
}
