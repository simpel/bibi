import "server-only";
import { listContacts, listCustomers, listMembers, type Result } from "@okazi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import type { InquiryFormData } from "./ui/inquiry-form-data";

const LIMIT = 100;

/**
 * Inquiry types, lists, customers, contacts and members (one page each). Contacts and members
 * are optional: without read access they show as "–" and cannot be picked.
 */
export async function loadInquiryData(): Promise<Result<InquiryFormData>> {
  const [typed, customers, contacts, members] = await Promise.all([
    loadTypedFormData({ base: "INQUIRY" }),
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listContacts, input: { limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
  ]);
  if (!typed.ok) return typed;
  if (!customers.ok) return customers;
  const people = members.ok ? members.value.items : [];
  const contactRows = contacts.ok ? contacts.value.items : [];
  return {
    ok: true,
    value: {
      ...typed.value,
      customers: customers.value.items.map(({ id, name }) => ({ id, name })),
      contacts: contactRows.map(({ id, name, customerId }) => ({ id, name, customerId })),
      members: people.map(({ userId, name }) => ({ id: userId, name })),
    },
  };
}
