import type { Db } from "@bibi/db";
import { localPartOn } from "./address";

export type ResolveInboundEndpointInput = {
  db: Db;
  recipients: readonly string[];
  domain: string;
};

export type InboundEndpointRef = { endpointId: string; organizationId: string };

/**
 * The organization inbox a received mail was sent to (ADR 0085 decision 2): the first recipient
 * that is an active EMAIL endpoint's `<local part>@<domain>`. Like `resolveInboundTicket`, the one
 * cross-organization lookup of the flow: it only reads the id pair that pins the rest.
 */
export async function resolveInboundEndpoint({
  db,
  recipients,
  domain,
}: ResolveInboundEndpointInput): Promise<InboundEndpointRef | null> {
  const locals = [
    ...new Set(
      recipients
        .map((address) => localPartOn({ address, domain }))
        .filter((local): local is string => local !== null),
    ),
  ];
  if (locals.length === 0) return null;
  const rows = await db.inboundEndpoint.findMany({
    where: { channel: "EMAIL", address: { in: locals }, active: true, status: "ACTIVE" },
    select: { id: true, organizationId: true, address: true },
  });
  const first = locals.map((local) => rows.find((row) => row.address === local)).find(Boolean);
  return first ? { endpointId: first.id, organizationId: first.organizationId } : null;
}
