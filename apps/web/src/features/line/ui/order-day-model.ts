import type { CalendarBlockDto, LineDto } from "@bibi/core";
import type { DaySnapshotBlock, DaySnapshotRow } from "@bibi/ui";
import { itemRoute, orderRoute } from "@/lib/routes";

const MINUTE = 60_000;
const DAY_MS = 86_400_000;
const DAY_START = 8 * 60;
const DAY_END = 20 * 60;

type DayLine = Pick<LineDto, "id" | "name" | "itemId" | "startsAt" | "endsAt"> &
  Partial<Pick<LineDto, "stateId" | "timeZone">>;

export type OrderDayInput = {
  orderId: string;
  orderReference?: number | null;
  customerName?: string | null;
  date?: string;
  lines: readonly DayLine[];
  /** Every booking in the organization those days (`calendar.range`), this order's included. */
  blocks: readonly CalendarBlockDto[];
  /** The day's midnight in the organization's zone. */
  midnight: Date;
  /** Names of the bookable items; an item not named here gets no row. */
  itemNames: ReadonlyMap<string, string>;
  /** Groups / entity types of the bookable items. */
  itemGroups?: ReadonlyMap<string, string>;
  /** Item states for this order's lines. */
  stateMap?: ReadonlyMap<string, { name: string; color: string }>;
  timeFormatter?: (span: { start: Date; end: Date; timeZone?: string }) => string;
  blockLabel: (input: { block: CalendarBlockDto }) => string;
  otherLabel: string;
  /** Text of the striped bar of a line that should have a time; set on one day only. */
  missingLabel?: string;
};

export type OrderDay = {
  startMinute: number;
  endMinute: number;
  rows: DaySnapshotRow[];
  /** Lines without a time or an item (a fee): they have no place on the day, so they are listed. */
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
function othersByItem({ input }: { input: OrderDayInput }) {
  const byItem = new Map<string, DaySnapshotBlock[]>();
  for (const block of input.blocks) {
    if (block.allocated || block.orderId === input.orderId) continue;
    if (!timedOnDay({ span: block, midnight: input.midnight })) continue;
    const list = byItem.get(block.itemId) ?? [];
    const resource = input.itemNames.get(block.itemId);
    const group = input.itemGroups?.get(block.itemId);
    const time = input.timeFormatter?.({ start: block.startsAt, end: block.endsAt });
    const state = block.stateName
      ? {
          name: block.stateName,
          color: block.stateColor ?? (block.soft ? "#f59e0b" : "#16a34a"),
        }
      : block.stateId && input.stateMap?.has(block.stateId)
        ? input.stateMap.get(block.stateId)
        : block.soft
          ? { name: "Prebooked", color: "#f59e0b" }
          : { name: "Booked", color: "#16a34a" };
    const href = block.orderId ? orderRoute({ id: block.orderId }) : undefined;
    list.push({
      ...{ id: block.id, label: input.blockLabel({ block }) },
      ...bar({ span: block, midnight: input.midnight }),
      tone: block.soft ? "soft" : "hard",
      href,
      details: {
        id: block.id,
        title: input.blockLabel({ block }),
        date: input.date,
        time,
        resource,
        group,
        state,
        order: block.reference !== null ? `#${block.reference}` : undefined,
        orderId: block.orderId ?? undefined,
        href,
        customer: block.details?.customer ?? undefined,
      },
    });
    byItem.set(block.itemId, list);
  }
  return byItem;
}

type OwnBar = DaySnapshotBlock & { itemId: string | null };

/** Rows: the order's items first, then every other item booked that day by name. */
function itemRows({ input, own }: { input: OrderDayInput; own: OwnBar[] }): DaySnapshotRow[] {
  const others = othersByItem({ input });
  const mine = [...new Set(own.flatMap(({ itemId }) => (itemId ? [itemId] : [])))];
  const rest = [...others.keys()]
    .filter((id) => !mine.includes(id))
    .sort((a, b) => (input.itemNames.get(a) ?? "").localeCompare(input.itemNames.get(b) ?? ""));
  return [...mine, ...rest].flatMap((itemId) => {
    const label = input.itemNames.get(itemId);
    if (!label) return [];
    const group = input.itemGroups?.get(itemId);
    const blocks = [...(others.get(itemId) ?? []), ...own.filter((b) => b.itemId === itemId)];
    return [{ id: itemId, label, group, href: itemRoute({ id: itemId }), blocks }];
  });
}

/** A line with an item but no time should have one: a row striped across the whole day. */
function missingRows({ input }: { input: OrderDayInput }): DaySnapshotRow[] {
  const { missingLabel, itemNames } = input;
  if (missingLabel === undefined) return [];
  return input.lines
    .filter(({ itemId, startsAt, endsAt }) => (!startsAt || !endsAt) && itemId)
    .map((line) => ({
      id: `missing-${line.id}`,
      label: line.name,
      blocks: [
        {
          id: `line-${line.id}`,
          label: missingLabel,
          tone: "missing",
          href: orderRoute({ id: input.orderId }),
          start: 0,
          end: 2 * 24 * 60,
          details: {
            id: `line-${line.id}`,
            title: line.name,
            resource: itemNames.get(line.itemId ?? ""),
          },
        },
      ],
    }));
}

/**
 * A saved order's day (the order page): everything booked that day, the other orders' dimmed
 * and this order's lines solid, its items first; lines without a bookable item in one row and
 * untimed lines listed. 08:00–20:00, widened in whole hours to cover every line.
 */
export function orderDayOf({ ...input }: OrderDayInput): OrderDay {
  const { midnight, itemNames, itemGroups, stateMap, timeFormatter } = input;
  const ownBlock = input.blocks.find((b) => b.orderId === input.orderId);
  const orderRef =
    input.orderReference !== undefined && input.orderReference !== null
      ? input.orderReference
      : ownBlock?.reference;
  const orderCustomer = input.customerName ?? ownBlock?.details?.customer ?? undefined;

  const own: OwnBar[] = input.lines.flatMap((line) => {
    const times = timedOnDay({ span: line, midnight });
    if (!times) return [];
    const itemId = line.itemId && itemNames.has(line.itemId) ? line.itemId : null;
    const resource = itemId ? itemNames.get(itemId) : undefined;
    const group = itemId ? itemGroups?.get(itemId) : undefined;
    const state = line.stateId
      ? stateMap?.get(line.stateId)
      : ownBlock?.stateName
        ? {
            name: ownBlock.stateName,
            color: ownBlock.stateColor ?? "#16a34a",
          }
        : undefined;
    const time = timeFormatter?.({
      start: times.startsAt,
      end: times.endsAt,
      timeZone: line.timeZone ?? undefined,
    });
    return [
      {
        id: `line-${line.id}`,
        label: line.name,
        tone: "own",
        itemId,
        href: orderRoute({ id: input.orderId }),
        ...bar({ span: times, midnight }),
        details: {
          id: `line-${line.id}`,
          title: line.name,
          date: input.date,
          time,
          resource,
          group,
          state,
          order: orderRef !== null && orderRef !== undefined ? `#${orderRef}` : undefined,
          orderId: input.orderId,
          href: orderRoute({ id: input.orderId }),
          customer: orderCustomer,
        },
      },
    ];
  });
  const loose = own.filter(({ itemId }) => itemId === null);
  const rows = itemRows({ input, own });
  const other = { id: "other", label: input.otherLabel, group: input.otherLabel, blocks: loose };
  return {
    startMinute: Math.floor(Math.min(DAY_START, ...own.map(({ start }) => start)) / 60) * 60,
    endMinute: Math.ceil(Math.max(DAY_END, ...own.map(({ end }) => end)) / 60) * 60,
    rows: [...(loose.length > 0 ? [...rows, other] : rows), ...missingRows({ input })],
    untimed: input.lines
      .filter(
        (line) =>
          (!line.startsAt || !line.endsAt) && (!line.itemId || input.missingLabel === undefined),
      )
      .map(({ name }) => name),
  };
}
