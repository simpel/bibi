import type { Db } from "@bibi/db";
import { resolveInboundEndpoint } from "./resolve-endpoint";
import { resolveInboundTicket } from "./resolve-ticket";

export type InboundRoute = {
  organizationId: string;
  ticketId: string | null;
  endpointId: string | null;
};

export type ResolveInboundRouteInput = { db: Db; recipients: readonly string[]; domain: string };

/**
 * Where a received mail goes (ADR 0085): a ticket's own address wins (a reply, stored on the
 * ticket even when the inbox is copied), else the organization's inbox address; null for neither.
 */
export async function resolveInboundRoute({
  db,
  recipients,
  domain,
}: ResolveInboundRouteInput): Promise<InboundRoute | null> {
  const ticket = await resolveInboundTicket({ db, recipients, domain });
  if (ticket) return { ...ticket, endpointId: null };
  const endpoint = await resolveInboundEndpoint({ db, recipients, domain });
  return endpoint ? { ...endpoint, ticketId: null } : null;
}
