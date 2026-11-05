import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import type { OrderStatusWarning } from "./status-history-schema";

export type StatusWarningsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  orderId: string;
  statusId: string;
};

/**
 * The status the fact "quote accepted" leads to: the first active status entered by the
 * `QUOTE_ACCEPTED` event or by a transition with an `ACCEPTED_QUOTE` gate. Null when the
 * organization has none.
 */
async function acceptancePosition({ context }: Pick<StatusWarningsInput, "context">) {
  const gated = {
    gatesInto: { some: { key: "ACCEPTED_QUOTE" as const } },
  };
  const orderStatus = await context.db.orderStatus.findFirst({
    where: { OR: [{ event: "QUOTE_ACCEPTED" }, gated] },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { position: true },
  });
  return orderStatus?.position ?? null;
}

/**
 * Where the order's status contradicts a fact owned elsewhere (ADR 0054, rule 4): an accepted
 * quote while the order is in an open status before the acceptance status. Derived, never
 * resolved by changing either side. Quote facts are only shown to callers who may read quotes.
 */
export async function statusWarnings({
  context,
  orderId,
  statusId,
}: StatusWarningsInput): Promise<OrderStatusWarning[]> {
  if (!hasPermission({ permissions: context.permissions, permission: "quote:read" })) return [];
  const accepted = await context.db.quote.count({ where: { orderId, quoteStatus: "ACCEPTED" } });
  if (accepted === 0) return [];
  const [position, orderStatus] = await Promise.all([
    acceptancePosition({ context }),
    context.db.orderStatus.findFirst({
      where: { id: statusId, status: { in: ["ACTIVE", "ARCHIVED"] } },
      select: { position: true, closes: true },
    }),
  ]);
  if (position === null || !orderStatus || orderStatus.closes) return [];
  return orderStatus.position < position ? ["QUOTE_ACCEPTED_IN_EARLIER_STATUS"] : [];
}
