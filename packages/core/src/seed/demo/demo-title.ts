import type { DemoTicket } from "./ticket-types";

/**
 * The demo ticket's title as staff would write it: its own, else its purpose (or type) and
 * customer. The seed names every ticket itself, so it never waits for a model.
 */
export function demoTitle({ ticket }: { ticket: DemoTicket }): string {
  if (ticket.title) return ticket.title;
  const purpose = ticket.fields?.Purpose;
  const what = typeof purpose === "string" ? purpose : ticket.type;
  return `${what} · ${ticket.customer}`;
}
