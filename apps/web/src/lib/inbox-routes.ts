import { ROUTES } from "./routes";

/** The inbox page (ADR 0085). */
export const INBOX_ROUTE = "/inbox";

export type InboxMessageRouteInput = { id: string };

/** One inbound message in the inbox (ADR 0085). */
export function inboxMessageRoute({ id }: InboxMessageRouteInput): string {
  return `${INBOX_ROUTE}/${encodeURIComponent(id)}`;
}

/** The intake with its paste dialog open (ADR 0084); not a step of its own. */
export const ORDER_FROM_MESSAGE_ROUTE = `${ROUTES.orderNew}/message`;

/** The intake opened from an inbound message, its paste dialog open (ADR 0081, 0084, 0085). */
export function orderFromMessageRoute({ id }: InboxMessageRouteInput): string {
  return `${ORDER_FROM_MESSAGE_ROUTE}?fromMessage=${encodeURIComponent(id)}`;
}
