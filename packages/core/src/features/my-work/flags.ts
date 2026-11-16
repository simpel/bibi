import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { expiringHolds } from "../dashboard/attention";
import type { DashboardHorizon } from "../dashboard/horizon";
import { deriveRunSheetStatus } from "../run-sheet/schema";
import { ACTING_REASONS, type Concerns } from "./concerns";
import type { MyWorkFlag } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

const EMPTY = {
  ...{ runSheetId: null, runSheetName: null, runSheetStatus: null, quoteId: null },
  ...{ reference: null, at: null, count: null },
} as const;

export type FlagOfInput = Partial<MyWorkFlag> & Pick<MyWorkFlag, "kind">;

/** A flag of `kind` with only the given fields set. */
export const flagOf = ({ ...flag }: FlagOfInput): MyWorkFlag => ({ ...EMPTY, ...flag });

/** The member acts on the order itself, or on the run sheet's responsibility on it. */
function acts({ concerns, orderId, responsibilityId }: ActsInput) {
  const reasons = [
    ...(concerns.orders.get(orderId) ?? []),
    ...(concerns.slots.get(`${orderId}:${responsibilityId}`) ?? []),
  ];
  return reasons.some((reason) => ACTING_REASONS.has(reason));
}
type ActsInput = { concerns: Concerns; orderId: string; responsibilityId: string };

/** Current run sheets of the orders not sent, changed since sent or blocked, that the member acts on. */
export async function runSheetFlags({ context, concerns, orderIds }: OrderFlagsInput) {
  const sheets = await context.db.runSheet.findMany({
    where: { current: true, publishedAt: null, fulfilledAt: null, orderId: { in: orderIds } },
    orderBy: [{ blocked: "desc" }, { createdAt: "asc" }],
    select: {
      ...{ id: true, orderId: true, responsibilityId: true, blocked: true },
      ...{ publishedAt: true, baseVersion: true, fulfilledAt: true },
      runSheetDefinition: { select: { name: true } },
    },
  });
  return sheets.flatMap((sheet) => {
    const status = deriveRunSheetStatus(sheet);
    if (status === "PENDING" || status === "FULFILLED" || !acts({ concerns, ...sheet })) return [];
    const runSheetName = sheet.runSheetDefinition.name;
    const flag = flagOf({ kind: "RUN_SHEET", runSheetId: sheet.id, runSheetName });
    return [{ orderId: sheet.orderId, flag: { ...flag, runSheetStatus: status } }];
  });
}

/** Sent quotes still waiting on the customer, oldest first. */
export async function quoteFlags({ context, orderIds }: Omit<OrderFlagsInput, "concerns">) {
  const quotes = await context.db.quote.findMany({
    where: { status: "ACTIVE", quoteStatus: "SENT", orderId: { in: orderIds } },
    orderBy: { statusChangedAt: "asc" },
    select: { id: true, orderId: true, statusChangedAt: true },
  });
  return quotes.map((q) => ({
    orderId: q.orderId,
    flag: flagOf({ kind: "QUOTE_WAITING", quoteId: q.id, at: q.statusChangedAt }),
  }));
}

/** Unread customer messages, one flag per order with the count. */
export async function messageFlags({ context, orderIds }: Omit<OrderFlagsInput, "concerns">) {
  const counts = await context.db.inboundMessage.groupBy({
    by: ["orderId"],
    where: { status: "ACTIVE", readAt: null, orderId: { in: orderIds } },
    _count: { _all: true },
  });
  return counts.flatMap(({ orderId, _count }) =>
    orderId ? [{ orderId, flag: flagOf({ kind: "UNREAD_MESSAGES", count: _count._all }) }] : [],
  );
}

export type OrderFlagsInput = { context: Context; concerns: Concerns; orderIds: string[] };

/**
 * The order-wide flags (spec: home), by order: run sheets where the member is the order's
 * assignee or owns the responsibility; holds running out, waiting quotes and unread customer
 * messages only on orders the member is the main assignee of. Each needs its feature's `read`.
 */
export async function orderFlags({
  context,
  concerns,
  orderIds,
  horizon,
}: OrderFlagsInput & { horizon: DashboardHorizon }): Promise<Map<string, MyWorkFlag[]>> {
  const own = orderIds.filter((id) => concerns.orders.get(id)?.has("ASSIGNEE"));
  const [sheets, holds, quotes, messages] = await Promise.all([
    canView({ context, feature: "runSheet" }) ? runSheetFlags({ context, concerns, orderIds }) : [],
    own.length > 0 ? expiringHolds({ context, horizon, orderIds: own }) : [],
    own.length > 0 && canView({ context, feature: "quote" })
      ? quoteFlags({ context, orderIds: own })
      : [],
    own.length > 0 && canView({ context, feature: "inbox" })
      ? messageFlags({ context, orderIds: own })
      : [],
  ]);
  const holdFlags = holds.map((hold) => ({
    orderId: hold.orderId,
    flag: flagOf({ kind: "HOLD_EXPIRES", at: hold.holdsUntil }),
  }));
  const byOrder = new Map<string, MyWorkFlag[]>();
  for (const { orderId, flag } of [...sheets, ...holdFlags, ...quotes, ...messages]) {
    byOrder.set(orderId, [...(byOrder.get(orderId) ?? []), flag]);
  }
  return byOrder;
}
