import "server-only";
import type { OrderDto, OrderStatusDto, PermissionSet } from "@bibi/core";
import { type CallerAbilities, getCallerAbilities } from "@/server/caller-abilities";
import { loadOrderStatuses } from "./load-order-names";

/**
 * The features whose writes a closed order refuses in core (`checkOrderOpen`): the order's own
 * details, its lines and needs, and its quote. Money, comments, run sheets and people stay open.
 */
const CONTENT_FEATURES = ["order", "program", "quote"] as const;

export type ClosedStatusInput = {
  order: Pick<OrderDto, "statusId">;
  statuses: readonly OrderStatusDto[];
};

/** The order's status when it closes the order, else null. */
export function closedStatus({ order, statuses }: ClosedStatusInput): OrderStatusDto | null {
  const status = statuses.find(({ id }) => id === order.statusId);
  return status?.closes ? status : null;
}

/** The abilities with the content features cut to `read`, so no edit control is offered. */
export function readOnlyAbilities({ abilities }: { abilities: CallerAbilities }): CallerAbilities {
  const permissions: PermissionSet = { ...abilities.permissions };
  for (const feature of CONTENT_FEATURES) {
    const actions = permissions[feature];
    if (actions) permissions[feature] = actions.includes("read") ? ["read"] : [];
  }
  return { ...abilities, permissions };
}

/**
 * What the caller may do on this order's page: their abilities, read-only for the content of a
 * closed order. The order page's sections use this in place of `getCallerAbilities`.
 */
export async function getOrderAbilities({
  order,
}: {
  order: Pick<OrderDto, "statusId">;
}): Promise<CallerAbilities> {
  const [abilities, statuses] = await Promise.all([getCallerAbilities(), loadOrderStatuses()]);
  if (!statuses.ok || !closedStatus({ order, statuses: statuses.value })) return abilities;
  return readOnlyAbilities({ abilities });
}
