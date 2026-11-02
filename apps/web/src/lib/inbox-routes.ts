import { ROUTES } from "./routes";

/** The inbox page (ADR 0085). */
export const INBOX_ROUTE = "/inbox";

export type InboxMessageRouteInput = { id: string };

/** One inbound message in the inbox (ADR 0085). */
export function inboxMessageRoute({ id }: InboxMessageRouteInput): string {
  return `${INBOX_ROUTE}/${encodeURIComponent(id)}`;
}

/** The intake opened from an inbound message (ADR 0081, 0085). */
export function ticketFromMessageRoute({ id }: InboxMessageRouteInput): string {
  return `${ROUTES.ticketNew}?fromMessage=${encodeURIComponent(id)}`;
}
