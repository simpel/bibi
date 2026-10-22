import "server-only";
import {
  listContacts,
  listCustomers,
  listMembers,
  listTicketPhases,
  type Result,
} from "@bibi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import type { TicketFormData } from "./ui/ticket-form-data";

const LIMIT = 100;

/**
 * Ticket types, lists, customers, contacts, members and phases (one page each). Without
 * `customer:read` the customers are hidden (ADR 0050 feature scope), not an error. Contacts and
 * members are optional: without read access they show as "–" and cannot be picked.
 */
export async function loadTicketData(): Promise<Result<TicketFormData>> {
  const [typed, customers, contacts, members, phases] = await Promise.all([
    loadTypedFormData({ base: "TICKET" }),
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listContacts, input: { limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
    runOperation({ operation: listTicketPhases, input: { limit: LIMIT } }),
  ]);
  if (!typed.ok) return typed;
  if (!customers.ok && customers.error.code !== "FORBIDDEN") return customers;
  if (!phases.ok) return phases;
  const people = members.ok ? members.value.items : [];
  const contactRows = contacts.ok ? contacts.value.items : [];
  const customerRows = customers.ok ? customers.value.items : [];
  return {
    ok: true,
    value: {
      ...typed.value,
      customers: customerRows.map(({ id, name }) => ({ id, name })),
      customersHidden: !customers.ok,
      contacts: contactRows.map(({ id, name, customerId }) => ({ id, name, customerId })),
      members: people.map(({ userId, name }) => ({ id: userId, name })),
      phases: phases.value.items,
    },
  };
}
