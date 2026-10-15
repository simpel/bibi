import type { Db } from "@okazi/db";
import { bookingIdFromAddress } from "./address";

export type ResolveInboundBookingInput = { db: Db; recipients: readonly string[]; domain: string };

export type InboundBookingRef = { bookingId: string; organizationId: string };

/**
 * The booking (and so the organization) a received mail belongs to: the first recipient that is
 * an active booking's inbound address. This is the one cross-organization lookup of the inbound
 * flow (ADR 0004): the organization is not known until the address is resolved, and it only
 * reads the id pair that then pins every later step to that organization.
 */
export async function resolveInboundBooking({
  db,
  recipients,
  domain,
}: ResolveInboundBookingInput): Promise<InboundBookingRef | null> {
  const ids = [
    ...new Set(
      recipients
        .map((address) => bookingIdFromAddress({ address, domain }))
        .filter((id): id is string => id !== null),
    ),
  ];
  if (ids.length === 0) return null;
  const rows = await db.booking.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: { id: true, organizationId: true },
  });
  const first = ids.map((id) => rows.find((row) => row.id === id)).find((row) => row);
  return first ? { bookingId: first.id, organizationId: first.organizationId } : null;
}
