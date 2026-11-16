import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { expiringHolds } from "../dashboard/attention";
import { daysOverdue } from "../finance/aging";
import { loadOpenInvoices } from "../finance/load-facts";
import type { Concerns } from "./concerns";
import { messageFlags, quoteFlags, runSheetFlags } from "./flags";
import { hoursBefore, type TaskWindow } from "./task-window";
import { CONFIRM_LEAD_HOURS, type MyWorkTask, RUN_SHEET_LEAD_HOURS } from "./tasks-schema";

type Context = Pick<OperationContext, "db" | "permissions">;

/** A task before its order's facts and group are added; `id` tells two of a kind on one order apart. */
export type RawTask = Partial<
  Omit<MyWorkTask, "key" | "group" | "reference" | "title" | "customerName">
> &
  Pick<MyWorkTask, "kind" | "orderId" | "dueAt"> & { id?: string | undefined };

/** When an order's active timed lines start and end. */
export type OrderSpan = { firstStart: Date; lastEnd: Date };

type SourceInput = { context: Context; window: TaskWindow };

/** The span of each open order's active timed lines, one query. */
export async function orderSpans({
  context,
  orderIds,
}: Pick<SourceInput, "context"> & { orderIds: string[] }): Promise<Map<string, OrderSpan>> {
  if (orderIds.length === 0) return new Map();
  const rows = await context.db.line.groupBy({
    by: ["orderId"],
    where: {
      orderId: { in: orderIds },
      status: "ACTIVE",
      startsAt: { not: null },
      endsAt: { not: null },
      order: { status: "ACTIVE" },
    },
    _min: { startsAt: true },
    _max: { endsAt: true },
  });
  return new Map(
    rows.flatMap(({ orderId, _min, _max }) =>
      _min.startsAt && _max.endsAt
        ? [[orderId, { firstStart: _min.startsAt, lastEnd: _max.endsAt }] as const]
        : [],
    ),
  );
}

type SpansInput = SourceInput & { spans: Map<string, OrderSpan> };

/** Orders not over yet whose `lead` hours before the first start fall before the end of next week. */
const upcoming = ({ spans, window, lead }: Omit<SpansInput, "context"> & { lead: number }) =>
  [...spans].filter(
    ([, span]) =>
      span.lastEnd > window.now &&
      hoursBefore({ instant: span.firstStart, hours: lead }) < window.end,
  );

/** Run sheets not sent, changed or blocked, on orders the member acts on. */
export async function runSheetTasks({
  context,
  concerns,
  spans,
  window,
}: SpansInput & { concerns: Concerns }): Promise<RawTask[]> {
  if (!canView({ context, feature: "runSheet" })) return [];
  const due = new Map(
    upcoming({ spans, window, lead: RUN_SHEET_LEAD_HOURS }).map(([id, span]) => [
      id,
      hoursBefore({ instant: span.firstStart, hours: RUN_SHEET_LEAD_HOURS }),
    ]),
  );
  if (due.size === 0) return [];
  const sheets = await runSheetFlags({ context, concerns, orderIds: [...due.keys()] });
  return sheets.flatMap(({ orderId, flag }) => {
    const dueAt = due.get(orderId);
    if (!dueAt || !flag.runSheetId) return [];
    const kind = flag.runSheetStatus === "BLOCKED" ? "RUN_SHEET_BLOCKED" : "RUN_SHEET_UNSENT";
    const sheet = { runSheetId: flag.runSheetId, runSheetName: flag.runSheetName };
    return [{ kind, orderId, dueAt, ...sheet, id: flag.runSheetId }];
  });
}

/** The member's orders that still hold lines softly close to their start (ADR 0044). */
export async function unconfirmedTasks({ context, spans, window }: SpansInput) {
  const near = upcoming({ spans, window, lead: CONFIRM_LEAD_HOURS });
  if (near.length === 0) return [];
  const rows = await context.db.line.groupBy({
    by: ["orderId"],
    where: {
      orderId: { in: near.map(([id]) => id) },
      status: "ACTIVE",
      state: { status: "ACTIVE", expires: true },
    },
    _count: { _all: true },
  });
  const firstStart = new Map(near.map(([id, span]) => [id, span.firstStart]));
  return rows.flatMap(({ orderId, _count }): RawTask[] => {
    const start = firstStart.get(orderId);
    if (!start) return [];
    const dueAt = hoursBefore({ instant: start, hours: CONFIRM_LEAD_HOURS });
    return [{ kind: "UNCONFIRMED", orderId, dueAt, count: _count._all }];
  });
}

/** Holds running out within 7 days, except on orders already asked to confirm. */
export async function holdTasks({
  context,
  window,
  orderIds,
}: SourceInput & { orderIds: string[] }): Promise<RawTask[]> {
  if (orderIds.length === 0) return [];
  const holds = await expiringHolds({ context, horizon: window.horizon, orderIds });
  return holds.map((hold) => ({
    kind: "HOLD_EXPIRES",
    orderId: hold.orderId,
    dueAt: hold.holdsUntil,
  }));
}

/** Sent quotes waiting on the customer and unread customer messages on the member's orders. */
export async function customerTasks({
  context,
  window,
  orderIds,
}: SourceInput & { orderIds: string[] }): Promise<RawTask[]> {
  if (orderIds.length === 0) return [];
  const [quotes, messages] = await Promise.all([
    canView({ context, feature: "quote" }) ? quoteFlags({ context, orderIds }) : [],
    canView({ context, feature: "inbox" }) ? messageFlags({ context, orderIds }) : [],
  ]);
  return [
    ...quotes.map(
      ({ orderId, flag }): RawTask => ({
        ...{ kind: "QUOTE_WAITING", orderId, dueAt: flag.at ?? window.now },
        ...{ quoteId: flag.quoteId, id: flag.quoteId ?? undefined },
      }),
    ),
    ...messages.map(
      ({ orderId, flag }): RawTask => ({
        ...{ kind: "UNREAD_MESSAGES", orderId, dueAt: window.now, count: flag.count },
      }),
    ),
  ];
}

/** Invoices on the member's orders with money open past their due date (Financials' gate). */
export async function overdueTasks({
  context,
  window,
  orderIds,
}: SourceInput & { orderIds: string[] }): Promise<RawTask[]> {
  const money =
    canView({ context, feature: "finance" }) && canView({ context, feature: "payment" });
  if (!money || orderIds.length === 0) return [];
  const own = new Set(orderIds);
  const open = await loadOpenInvoices({ context });
  return open.flatMap((row): RawTask[] =>
    row.dueDate &&
    own.has(row.orderId) &&
    daysOverdue({ dueDate: row.dueDate, now: window.now }) > 0
      ? [
          {
            ...{ kind: "PAYMENT_OVERDUE", orderId: row.orderId, dueAt: row.dueDate },
            ...{ invoiceId: row.id, amountMinor: row.openMinor, id: row.id },
          },
        ]
      : [],
  );
}

/** How far back an order left open is still asked about. */
const NOT_CLOSED_REACH_MS = 30 * 86_400_000;

/**
 * The member's orders whose lines have all ended in the last 30 days while their status does
 * not close.
 */
export async function notClosedTasks({ context, spans, window }: SpansInput): Promise<RawTask[]> {
  if (!canView({ context, feature: "pipeline" })) return [];
  const since = window.now.getTime() - NOT_CLOSED_REACH_MS;
  const over = [...spans].filter(
    ([, span]) => span.lastEnd <= window.now && span.lastEnd.getTime() > since,
  );
  if (over.length === 0) return [];
  const open = await context.db.order.findMany({
    where: { id: { in: over.map(([id]) => id) }, orderStatus: { closes: false } },
    select: { id: true },
  });
  const ids = new Set(open.map((order) => order.id));
  return over.flatMap(([orderId, span]): RawTask[] =>
    ids.has(orderId) ? [{ kind: "NOT_CLOSED", orderId, dueAt: span.lastEnd }] : [],
  );
}
