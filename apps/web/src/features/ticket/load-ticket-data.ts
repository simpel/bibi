import "server-only";
import {
  listContacts,
  listCustomers,
  listMembers,
  listTicketPhases,
  type Result,
} from "@okazi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import type { TicketFormData } from "./ui/ticket-form-data";

const LIMIT = 100;

/**
 * Ticket types, lists, customers, contacts, members and phases (one page each). Contacts and
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
  if (!customers.ok) return customers;
  if (!phases.ok) return phases;
  const people = members.ok ? members.value.items : [];
  const contactRows = contacts.ok ? contacts.value.items : [];
  return {
    ok: true,
    value: {
      ...typed.value,
      customers: customers.value.items.map(({ id, name }) => ({ id, name })),
      contacts: contactRows.map(({ id, name, customerId }) => ({ id, name, customerId })),
      members: people.map(({ userId, name }) => ({ id: userId, name })),
      phases: phases.value.items,
    },
  };
}
