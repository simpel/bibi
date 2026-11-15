import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { toIsoDate } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import { type Concerns, type ConcernWindow, concernsOf } from "./concerns";

type Context = Pick<OperationContext, "db">;

const prefix = ({ key }: { key: string }) => key.slice(0, key.indexOf(":"));

/** Orders that concern the member as a whole: main assignment, a responsibility, a run sheet received. */
export function concernedOrderIds({ concerns }: { concerns: Concerns }): Set<string> {
  return new Set([
    ...concerns.orders.keys(),
    ...[...concerns.slots.keys()].map((key) => prefix({ key })),
    ...[...concerns.received].map((key) => prefix({ key })),
  ]);
}

export type LinesInput = { context: Context; concerns: Concerns; window: ConcernWindow };

/** Timed lines in the window of open orders that concern the member, as a `where`. */
function dayLinesWhere({ concerns, window }: Omit<LinesInput, "context">): Prisma.LineWhereInput {
  return {
    status: "ACTIVE",
    startsAt: { gte: window.start, lt: window.end },
    endsAt: { not: null },
    order: { status: "ACTIVE", orderStatus: { closes: false } },
    OR: [
      { orderId: { in: [...concernedOrderIds({ concerns })] } },
      { id: { in: [...concerns.lines.keys()] } },
    ],
  };
}

/**
 * Timed lines in the window of open orders that concern the member: every line of an order that
 * concerns them as a whole, else only the lines that do (staffed, an item they own).
 */
export function loadDayLines({ context, concerns, window }: LinesInput) {
  return context.db.line.findMany({
    where: dayLinesWhere({ concerns, window }),
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: {
      ...{ id: true, orderId: true, itemId: true, startsAt: true, endsAt: true },
      item: { select: { name: true, entityType: { select: { capabilities: true } } } },
      order: {
        select: {
          ...{ reference: true, title: true, guaranteedHeadcount: true, estimatedHeadcount: true },
          customer: { select: { name: true } },
          orderStatus: { select: { name: true, color: true } },
        },
      },
    },
  });
}

/** How far ahead `next` looks for the member's next card. */
const NEXT_REACH_MS = 366 * 86_400_000;

export type NextDayInput = { context: Context; userId: string; after: Date; timeZone: string };

/** The first day from `after` (within a year) that has a card for the member, or null. */
export async function nextCardDay({ context, userId, after, timeZone }: NextDayInput) {
  const window = { start: after, end: new Date(after.getTime() + NEXT_REACH_MS) };
  const concerns = await concernsOf({ context, userId, window });
  const first = await context.db.line.findFirst({
    where: dayLinesWhere({ concerns, window }),
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: { startsAt: true },
  });
  return first?.startsAt ? dayOf({ instant: first.startsAt, timeZone }) : null;
}
export type DayLine = Awaited<ReturnType<typeof loadDayLines>>[number];

/** The day an instant falls on in the zone, as `YYYY-MM-DD`. */
export const dayOf = ({ instant, timeZone }: { instant: Date; timeZone: string }) =>
  toIsoDate({ date: toZonedParts({ instant, timeZone }).date });

/** Every day each order has timed lines on, in order, for "day 2 of 3". */
export async function orderDays({
  context,
  orderIds,
  timeZone,
}: {
  context: Context;
  orderIds: string[];
  timeZone: string;
}): Promise<Map<string, string[]>> {
  const lines = await context.db.line.findMany({
    where: { status: "ACTIVE", orderId: { in: orderIds }, startsAt: { not: null } },
    select: { orderId: true, startsAt: true },
  });
  const days = new Map<string, Set<string>>();
  for (const { orderId, startsAt } of lines) {
    if (!startsAt) continue;
    const set = days.get(orderId) ?? new Set<string>();
    set.add(dayOf({ instant: startsAt, timeZone }));
    days.set(orderId, set);
  }
  return new Map([...days].map(([orderId, set]) => [orderId, [...set].sort()]));
}
