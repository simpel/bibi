import type { Db } from "@okazi/db";
import { ticketIdFromAddress } from "./address";

export type ResolveInboundTicketInput = { db: Db; recipients: readonly string[]; domain: string };

export type InboundTicketRef = { ticketId: string; organizationId: string };

/**
 * The ticket (and so the organization) a received mail belongs to: the first recipient that is
 * an active ticket's inbound address. This is the one cross-organization lookup of the inbound
 * flow (ADR 0004): the organization is not known until the address is resolved, and it only
 * reads the id pair that then pins every later step to that organization.
 */
export async function resolveInboundTicket({
  db,
  recipients,
  domain,
}: ResolveInboundTicketInput): Promise<InboundTicketRef | null> {
  const ids = [
    ...new Set(
      recipients
        .map((address) => ticketIdFromAddress({ address, domain }))
        .filter((id): id is string => id !== null),
    ),
  ];
  if (ids.length === 0) return null;
  const rows = await db.ticket.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: { id: true, organizationId: true },
  });
  const first = ids.map((id) => rows.find((row) => row.id === id)).find((row) => row);
  return first ? { ticketId: first.id, organizationId: first.organizationId } : null;
}
