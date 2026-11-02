import "server-only";
import { listCustomers, listTickets } from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import { runOperation } from "@/server/run-operation";

const LIMIT = 50;

/**
 * The latest active tickets to attach a message to, as `#<reference> · <customer>`; without
 * `customer:read` only the reference. Empty without `ticket:read`.
 */
export async function loadTicketOptions(): Promise<NamedOption[]> {
  const [tickets, customers] = await Promise.all([
    runOperation({ operation: listTickets, input: { limit: LIMIT } }),
    runOperation({ operation: listCustomers, input: { limit: 100 } }),
  ]);
  if (!tickets.ok) return [];
  const names = new Map(customers.ok ? customers.value.items.map((c) => [c.id, c.name]) : []);
  return tickets.value.items.map((ticket) => {
    const customer = names.get(ticket.customerId);
    return {
      id: ticket.id,
      name: customer ? `#${ticket.reference} · ${customer}` : `#${ticket.reference}`,
    };
  });
}
