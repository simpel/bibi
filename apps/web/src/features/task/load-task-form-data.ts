import "server-only";
import { listContacts, listCustomers, listMembers, type Result } from "@bibi/core";
import { cache } from "react";
import { getCallerAbilities } from "@/server/caller-abilities";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { loadPickerItems } from "@/server/load-items-for-pickers";
import { runOperation } from "@/server/run-operation";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import type { TaskFormData } from "./ui/task-form-data";

const LIMIT = 100;

/**
 * Task types, customers, contacts, members and items (one page each), once per request. Without
 * `customer:read` the customers are hidden, not an error; members and items are optional.
 */
export const loadTaskFormData = cache(async (): Promise<Result<TaskFormData>> => {
  const [types, customers, contacts, members, items, abilities, timeZone] = await Promise.all([
    loadEntityTypesOf({ base: "TASK" }),
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    runOperation({ operation: listContacts, input: { limit: LIMIT } }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
    loadPickerItems(),
    getCallerAbilities(),
    loadOrganizationTimeZone(),
  ]);
  if (!types.ok) return types;
  if (!customers.ok && customers.error.code !== "FORBIDDEN") return customers;
  const contactRows = contacts.ok ? contacts.value.items : [];
  return {
    ok: true,
    value: {
      types: types.value.items.map(({ id, name, taskShape }) => ({
        ...{ id, name },
        shape: taskShape ?? "MEETING",
      })),
      customers: customers.ok ? customers.value.items.map(({ id, name }) => ({ id, name })) : [],
      customersHidden: !customers.ok,
      contacts: contactRows.map(({ id, name, customerId, email, phone }) => ({
        ...{ id, name, customerId, email, phone },
      })),
      members: members.ok
        ? members.value.items.map(({ userId, name, email }) => ({ id: userId, name, email }))
        : [],
      // Items at a venue (rooms, areas): what a site visit may show.
      items: items.ok
        ? items.value.items.filter((item) => item.venueId).map(({ id, name }) => ({ id, name }))
        : [],
      meId: abilities.userId,
      timeZone,
    },
  };
});

/** The same data as a promise the detail page hands its in-place editors (null when it failed). */
export const taskFormDataPromise = (): Promise<TaskFormData | null> =>
  loadTaskFormData().then((result) => (result.ok ? result.value : null));
