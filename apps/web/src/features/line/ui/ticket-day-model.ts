import type { CalendarBlockDto, LineDto } from "@bibi/core";
import type { DaySnapshotBlock, DaySnapshotRow } from "@bibi/ui";

const MINUTE = 60_000;
const DAY_MS = 86_400_000;
const DAY_START = 8 * 60;
const DAY_END = 20 * 60;

type DayLine = Pick<LineDto, "id" | "name" | "itemId" | "startsAt" | "endsAt">;

export type TicketDayInput = {
  ticketId: string;
  lines: readonly DayLine[];
  /** Every booking in the organization those days (`calendar.range`), this ticket's included. */
  blocks: readonly CalendarBlockDto[];
  /** The day's midnight in the organization's zone. */
  midnight: Date;
  /** Names of the bookable items; an item not named here gets no row. */
  itemNames: ReadonlyMap<string, string>;
  blockLabel: (input: { block: CalendarBlockDto }) => string;
  otherLabel: string;
};

export type TicketDay = {
  startMinute: number;
  endMinute: number;
  rows: DaySnapshotRow[];
  /** The ticket's lines without a time: they have no place on the day, so they are listed. */
  untimed: string[];
};

type Span = { startsAt: Date | null; endsAt: Date | null };
type Timed = { startsAt: Date; endsAt: Date };

const minutesOf = ({ at, midnight }: { at: Date; midnight: Date }) =>
  Math.round((at.getTime() - midnight.getTime()) / MINUTE);

/** The span's times when it shares time with the day that starts at `midnight`, else null. */
function timedOnDay({ span, midnight }: { span: Span; midnight: Date }): Timed | null {
  const { startsAt, endsAt } = span;
  if (!startsAt || !endsAt) return null;
  const inDay = startsAt.getTime() < midnight.getTime() + DAY_MS && endsAt > midnight;
  return inDay ? { startsAt, endsAt } : null;
}

const bar = ({ span, midnight }: { span: Timed; midnight: Date }) => ({
  start: minutesOf({ at: span.startsAt, midnight }),
  end: minutesOf({ at: span.endsAt, midnight }),
});

/** Every other booking that day, dimmed (hard darker than soft), by item. */
function othersByItem({ input }: { input: TicketDayInput }) {
  const byItem = new Map<string, DaySnapshotBlock[]>();
  for (const block of input.blocks) {
    if (block.allocated || block.ticketId === input.ticketId) continue;
    if (!timedOnDay({ span: block, midnight: input.midnight })) continue;
    const list = byItem.get(block.itemId) ?? [];
    list.push({
      ...{ id: block.id, label: input.blockLabel({ block }) },
      ...bar({ span: block, midnight: input.midnight }),
      tone: block.soft ? "soft" : "hard",
    });
    byItem.set(block.itemId, list);
  }
  return byItem;
}

type OwnBar = DaySnapshotBlock & { itemId: string | null };

/** Rows: the ticket's items first, then every other item booked that day by name. */
function itemRows({ input, own }: { input: TicketDayInput; own: OwnBar[] }): DaySnapshotRow[] {
  const others = othersByItem({ input });
  const mine = [...new Set(own.flatMap(({ itemId }) => (itemId ? [itemId] : [])))];
  const rest = [...others.keys()]
    .filter((id) => !mine.includes(id))
    .sort((a, b) => (input.itemNames.get(a) ?? "").localeCompare(input.itemNames.get(b) ?? ""));
  return [...mine, ...rest].flatMap((itemId) => {
    const label = input.itemNames.get(itemId);
    if (!label) return [];
    const blocks = [...(others.get(itemId) ?? []), ...own.filter((b) => b.itemId === itemId)];
    return [{ id: itemId, label, blocks }];
  });
}

/**
 * A saved ticket's day (the ticket page): everything booked that day, the other tickets' dimmed
 * and this ticket's lines solid, its items first; lines without a bookable item in one row and
 * untimed lines listed. 08:00–20:00, widened in whole hours to cover every line.
 */
export function ticketDayOf({ ...input }: TicketDayInput): TicketDay {
  const { midnight, itemNames } = input;
  const own: OwnBar[] = input.lines.flatMap((line) => {
    const times = timedOnDay({ span: line, midnight });
    if (!times) return [];
    const itemId = line.itemId && itemNames.has(line.itemId) ? line.itemId : null;
    return [
      {
        id: `line-${line.id}`,
        label: line.name,
        tone: "own",
        itemId,
        ...bar({ span: times, midnight }),
      },
    ];
  });
  const loose = own.filter(({ itemId }) => itemId === null);
  const rows = itemRows({ input, own });
  const other = { id: "other", label: input.otherLabel, blocks: loose };
  return {
    startMinute: Math.floor(Math.min(DAY_START, ...own.map(({ start }) => start)) / 60) * 60,
    endMinute: Math.ceil(Math.max(DAY_END, ...own.map(({ end }) => end)) / 60) * 60,
    rows: loose.length > 0 ? [...rows, other] : rows,
    untimed: input.lines.filter((line) => !line.startsAt || !line.endsAt).map(({ name }) => name),
  };
}
