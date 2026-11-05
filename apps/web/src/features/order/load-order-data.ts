import "server-only";
import {
  listContacts,
  listCustomers,
  listMembers,
  listOrderStatuses,
  type Result,
} from "@bibi/core";
import { cache } from "react";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import type { OrderFormData } from "./ui/order-form-data";

const LIMIT = 100;

/**
 * Order types, lists, customers, contacts, members and statuses (one page each). Without
 * `customer:read` the customers are hidden (ADR 0050 feature scope), not an error. Contacts and
 * members are optional: without read access they show as "–" and cannot be picked. Cached per
 * request, so the sections that need it share one read.
 */
export const loadOrderData = cache(async (): Promise<Result<OrderFormData>> => {
  const [typed, customers, contacts, members, statuses] = await Promise.all([
    loadTypedFormData({ base: "ORDER" }),
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listContacts, input: { limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
    runOperation({ operation: listOrderStatuses, input: { limit: LIMIT } }),
  ]);
  if (!typed.ok) return typed;
  if (!customers.ok && customers.error.code !== "FORBIDDEN") return customers;
  if (!statuses.ok) return statuses;
  const people = members.ok ? members.value.items : [];
  const contactRows = contacts.ok ? contacts.value.items : [];
  const customerRows = customers.ok ? customers.value.items : [];
  return {
    ok: true,
    value: {
      ...typed.value,
      customers: customerRows.map(({ id, name }) => ({ id, name })),
      customersHidden: !customers.ok,
      contacts: contactRows.map(({ id, name, customerId, email, phone }) => ({
        ...{ id, name, customerId, email, phone },
      })),
      members: people.map(({ userId, name, email }) => ({ id: userId, name, email })),
      statuses: statuses.value.items,
    },
  };
});
