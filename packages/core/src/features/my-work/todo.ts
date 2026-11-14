import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { expiringHolds } from "../dashboard/attention";
import type { DashboardHorizon } from "../dashboard/horizon";
import { deriveRunSheetStatus } from "../run-sheet/schema";
import { ACTING_REASONS, type Concerns, type ConcernWindow, sortReasons } from "./concerns";
import type { ConcernReason, MyWorkMessages, MyWorkTodo } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

export type TodoInput = {
  context: Context;
  concerns: Concerns;
  /** From now to the end of the period or a week ahead, whichever is later. */
  ahead: ConcernWindow;
  horizon: DashboardHorizon;
};

/** Orders the member is the main assignee of. */
const ownOrders = ({ concerns }: { concerns: Concerns }) =>
  [...concerns.orders].filter(([, reasons]) => reasons.has("ASSIGNEE")).map(([orderId]) => orderId);

/** Why the member must act on a run sheet: main assignee of its order or its responsibility. */
function actingReason({
  concerns,
  orderId,
  responsibilityId,
}: {
  concerns: Concerns;
  orderId: string;
  responsibilityId: string;
}) {
  const reasons: ConcernReason[] = [
    ...(concerns.orders.get(orderId) ?? []),
    ...(concerns.slots.get(`${orderId}:${responsibilityId}`) ?? []),
  ].filter((reason) => ACTING_REASONS.has(reason));
  return sortReasons({ reasons })[0] ?? null;
}

/** Current run sheets not sent, changed since sent or blocked, for orders starting ahead. */
async function runSheetTasks({ context, concerns, ahead }: Omit<TodoInput, "horizon">) {
  const inside = { status: "ACTIVE", startsAt: { gte: ahead.start, lt: ahead.end } } as const;
  const sheets = await context.db.runSheet.findMany({
    where: {
      current: true,
      publishedAt: null,
      fulfilledAt: null,
      order: { status: "ACTIVE", orderStatus: { closes: false }, lines: { some: inside } },
    },
    select: {
      id: true,
      orderId: true,
      responsibilityId: true,
      version: true,
      blocked: true,
      publishedAt: true,
      baseVersion: true,
      runSheetDefinition: { select: { name: true } },
      order: {
        select: {
          reference: true,
          title: true,
          lines: {
            where: inside,
            orderBy: { startsAt: "asc" },
            take: 1,
            select: { startsAt: true },
          },
        },
      },
    },
  });
  return sheets
    .flatMap((sheet) => {
      const reason = actingReason({ concerns, ...sheet });
      const startsAt = sheet.order.lines[0]?.startsAt;
      const status = deriveRunSheetStatus(sheet);
      if (
        !reason ||
        !startsAt ||
        (status !== "DRAFT" && status !== "REVISION_PENDING" && status !== "BLOCKED")
      ) {
        return [];
      }
      const { id: runSheetId, orderId, version } = sheet;
      const { reference, title } = sheet.order;
      const runSheetName = sheet.runSheetDefinition.name;
      return [
        { runSheetId, runSheetName, version, status, orderId, reference, title, startsAt, reason },
      ];
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** Sent quotes on the member's orders still waiting on the customer, by expiry. */
async function waitingQuotes({ context, orderIds }: { context: Context; orderIds: string[] }) {
  const quotes = await context.db.quote.findMany({
    where: { status: "ACTIVE", quoteStatus: "SENT", orderId: { in: orderIds } },
    orderBy: [{ validUntil: { sort: "asc", nulls: "last" } }, { statusChangedAt: "asc" }],
    select: {
      id: true,
      orderId: true,
      version: true,
      validUntil: true,
      statusChangedAt: true,
      order: { select: { reference: true, title: true } },
    },
  });
  return quotes.map((q) => ({
    ...{ quoteId: q.id, orderId: q.orderId, reference: q.order.reference, title: q.order.title },
    ...{ version: q.version, sentAt: q.statusChangedAt, validUntil: q.validUntil },
  }));
}

/** Unread customer messages on the member's orders, newest first, one entry per order. */
async function unreadMessages({ context, orderIds }: { context: Context; orderIds: string[] }) {
  const messages = await context.db.inboundMessage.findMany({
    where: { status: "ACTIVE", readAt: null, orderId: { in: orderIds } },
    orderBy: { receivedAt: "desc" },
    select: {
      orderId: true,
      receivedAt: true,
      order: { select: { reference: true, title: true } },
    },
  });
  const byOrder = new Map<string, MyWorkMessages>();
  for (const m of messages) {
    if (!m.orderId || !m.order) continue;
    const entry = byOrder.get(m.orderId);
    if (entry) entry.unread += 1;
    else {
      const { reference, title } = m.order;
      byOrder.set(m.orderId, {
        orderId: m.orderId,
        reference,
        title,
        unread: 1,
        latestAt: m.receivedAt,
      });
    }
  }
  return [...byOrder.values()];
}

/**
 * What the member must act on (spec: home): run sheets to send or unblock where they are the
 * order's assignee or own the responsibility, holds running out, quotes waiting and unread
 * customer messages on their own orders. Each part needs its feature's `read`.
 */
export async function todoOf({
  context,
  concerns,
  ahead,
  horizon,
}: TodoInput): Promise<MyWorkTodo> {
  const orderIds = ownOrders({ concerns });
  const [runSheets, holds, quotes, messages] = await Promise.all([
    canView({ context, feature: "runSheet" }) ? runSheetTasks({ context, concerns, ahead }) : null,
    orderIds.length > 0 && canView({ context, feature: "order" })
      ? expiringHolds({ context, horizon, orderIds })
      : [],
    canView({ context, feature: "quote" }) ? waitingQuotes({ context, orderIds }) : null,
    canView({ context, feature: "inbox" }) ? unreadMessages({ context, orderIds }) : null,
  ]);
  return { runSheets, expiringHolds: holds, quotes, messages };
}
