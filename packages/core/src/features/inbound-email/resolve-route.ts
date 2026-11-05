import type { Db } from "@bibi/db";
import { resolveInboundEndpoint } from "./resolve-endpoint";
import { resolveInboundOrder } from "./resolve-order";

export type InboundRoute = {
  organizationId: string;
  orderId: string | null;
  endpointId: string | null;
};

export type ResolveInboundRouteInput = { db: Db; recipients: readonly string[]; domain: string };

/**
 * Where a received mail goes (ADR 0085): an order's own address wins (a reply, stored on the
 * order even when the inbox is copied), else the organization's inbox address; null for neither.
 */
export async function resolveInboundRoute({
  db,
  recipients,
  domain,
}: ResolveInboundRouteInput): Promise<InboundRoute | null> {
  const order = await resolveInboundOrder({ db, recipients, domain });
  if (order) return { ...order, endpointId: null };
  const endpoint = await resolveInboundEndpoint({ db, recipients, domain });
  return endpoint ? { ...endpoint, orderId: null } : null;
}
