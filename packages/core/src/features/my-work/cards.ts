import type { OperationContext } from "../../operations/types";
import { visibleTo } from "../../shared/visible-to";
import type { DashboardHorizon } from "../dashboard/horizon";
import { blocks, loadOccupancy, type OccupancyRow } from "../order/plan/occupancy-rows";
import { overlaps } from "../order/plan/planned-line";
import { type Concerns, type ConcernWindow, sortReasons } from "./concerns";
import { flagOf, orderFlags } from "./flags";
import { type DayLine, dayOf, loadDayLines, orderDays } from "./lines";
import type { ConcernReason, MyWorkCard, MyWorkFlag } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

const DAY_MS = 86_400_000;

/** Each line's own hold, and the other orders' blocking rows overlapping its soft hold. */
function holdsOf({ lines, rows }: { lines: DayLine[]; rows: OccupancyRow[] }) {
  const ids = new Set(lines.map((line) => line.id));
  const own = new Map(
    rows.flatMap((row) =>
      row.lineId && ids.has(row.lineId) && row.type === "HOLD" && row.holdKind
        ? [[row.lineId, row] as const]
        : [],
    ),
  );
  const clashes = new Map<string, OccupancyRow[]>();
  for (const [lineId, mine] of own) {
    if (mine.holdKind !== "SOFT") continue;
    const reference = lines.find((line) => line.id === lineId)?.order.reference;
    const met = rows.filter(
      (row) =>
        row.itemId === mine.itemId &&
        blocks({ row }) &&
        row.orderReference !== reference &&
        overlaps({ a: row, b: mine }),
    );
    if (met.length > 0) clashes.set(lineId, met);
  }
  return { own, clashes };
}

type Group = { orderId: string; day: string; first: DayLine; lines: DayLine[] };

/** The member's reasons for one order's lines on one day. */
function reasonsOf({ concerns, group }: { concerns: Concerns; group: Group }): ConcernReason[] {
  const { orderId } = group;
  const reasons: ConcernReason[] = [...(concerns.orders.get(orderId) ?? [])];
  for (const [key, set] of concerns.slots) if (key.startsWith(`${orderId}:`)) reasons.push(...set);
  for (const key of concerns.received) if (key.startsWith(`${orderId}:`)) reasons.push("RECIPIENT");
  for (const line of group.lines) reasons.push(...(concerns.lines.get(line.id) ?? []));
  return sortReasons({ reasons });
}

type BuildInput = {
  context: Context;
  group: Group;
  reasons: ConcernReason[];
  days: string[];
  holds: ReturnType<typeof holdsOf>;
  flags: MyWorkFlag[];
};

function buildCard({ context, group, reasons, days, holds, flags }: BuildInput): MyWorkCard {
  const { first } = group;
  const { order } = first;
  const kinds = group.lines.flatMap((line) => holds.own.get(line.id)?.holdKind ?? []);
  const clashes = group.lines.flatMap((line) => holds.clashes.get(line.id) ?? []);
  const places = group.lines.flatMap((line) =>
    line.item?.entityType.capabilities.includes("BOOKABLE") ? [line.item.name] : [],
  );
  const clash = clashes[0];
  return {
    key: `${group.orderId}:${group.day}`,
    ...{ orderId: group.orderId, reference: order.reference, title: order.title },
    customerName: visibleTo({ context, feature: "customer", value: order.customer.name }),
    status: visibleTo({ context, feature: "pipeline", value: order.orderStatus }),
    ...{ day: group.day, dayIndex: days.indexOf(group.day) + 1, dayCount: days.length },
    startsAt: first.startsAt ?? new Date(0),
    endsAt: new Date(Math.max(...group.lines.map((line) => line.endsAt?.getTime() ?? 0))),
    headcount: order.guaranteedHeadcount ?? order.estimatedHeadcount,
    places: visibleTo({ context, feature: "item", value: [...new Set(places)] }),
    hold: kinds.includes("HARD") ? "HARD" : kinds.includes("SOFT") ? "SOFT" : null,
    reasons,
    flags: [
      ...(clash ? [flagOf({ kind: "HARD_CLASH", reference: clash.orderReference })] : []),
      ...flags,
    ],
  };
}

export type CardsInput = {
  context: Context;
  concerns: Concerns;
  window: ConcernWindow;
  horizon: DashboardHorizon;
};

/**
 * One card per order per day it has timed lines that concern the member (spec: home), by start.
 * Order-wide flags go on the order's first card in the window only, so they are not repeated.
 */
export async function myCards({ context, concerns, window, horizon }: CardsInput) {
  const { timeZone } = horizon;
  const lines = await loadDayLines({ context, concerns, window });
  const groups = new Map<string, Group>();
  for (const line of lines) {
    const day = dayOf({ instant: line.startsAt ?? window.start, timeZone });
    const key = `${line.orderId}:${day}`;
    const group = groups.get(key) ?? { orderId: line.orderId, day, first: line, lines: [] };
    group.lines.push(line);
    groups.set(key, group);
  }
  const orderIds = [...new Set(lines.map((line) => line.orderId))];
  const itemIds = lines.flatMap((line) => (line.itemId ? [line.itemId] : []));
  const reach = {
    startsAt: new Date(window.start.getTime() - DAY_MS),
    endsAt: new Date(window.end.getTime() + DAY_MS),
  };
  const [days, rows, flags] = await Promise.all([
    orderDays({ context, orderIds, timeZone }),
    loadOccupancy({ context, itemIds, window: reach }),
    orderFlags({ context, concerns, orderIds, horizon }),
  ]);
  const holds = holdsOf({ lines, rows });
  const flagged = new Set<string>();
  return [...groups.values()].flatMap((group) => {
    const reasons = reasonsOf({ concerns, group });
    if (reasons.length === 0) return [];
    const first = !flagged.has(group.orderId);
    flagged.add(group.orderId);
    const own = first ? (flags.get(group.orderId) ?? []) : [];
    const orderDayList = days.get(group.orderId) ?? [group.day];
    return [buildCard({ context, group, reasons, days: orderDayList, holds, flags: own })];
  });
}
