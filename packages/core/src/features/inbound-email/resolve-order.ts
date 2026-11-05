import type { Db } from "@bibi/db";
import { orderIdFromAddress } from "./address";

export type ResolveInboundOrderInput = { db: Db; recipients: readonly string[]; domain: string };

export type InboundOrderRef = { orderId: string; organizationId: string };

/**
 * The order (and so the organization) a received mail belongs to: the first recipient that is
 * an active order's inbound address. This is the one cross-organization lookup of the inbound
 * flow (ADR 0004): the organization is not known until the address is resolved, and it only
 * reads the id pair that then pins every later step to that organization.
 */
export async function resolveInboundOrder({
  db,
  recipients,
  domain,
}: ResolveInboundOrderInput): Promise<InboundOrderRef | null> {
  const ids = [
    ...new Set(
      recipients
        .map((address) => orderIdFromAddress({ address, domain }))
        .filter((id): id is string => id !== null),
    ),
  ];
  if (ids.length === 0) return null;
  const rows = await db.order.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: { id: true, organizationId: true },
  });
  const first = ids.map((id) => rows.find((row) => row.id === id)).find((row) => row);
  return first ? { orderId: first.id, organizationId: first.organizationId } : null;
}
