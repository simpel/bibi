import "server-only";
import { getContact, listOrderStatuses, type OrderDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";
import { loadCustomer } from "../customer/load-customer";
import type { OrderFormData } from "./ui/order-form-data";

export type OrderNames = Pick<OrderFormData, "customers" | "contacts" | "customersHidden">;

type OrderNamesInput = { order: OrderDto };

/**
 * The order's own customer and contact, read by id for the key facts (ADR 0097): two small reads
 * instead of every customer and contact. Without `customer:read` they show as hidden.
 */
export async function loadOrderNames({ order }: OrderNamesInput): Promise<OrderNames> {
  const { customerId, contactId } = order;
  const [customer, contact] = await Promise.all([
    customerId ? loadCustomer({ id: customerId }) : null,
    contactId ? runOperation({ operation: getContact, input: { id: contactId } }) : null,
  ]);
  const hidden = customer?.ok === false && customer.error.code === "FORBIDDEN";
  return {
    customers: customer?.ok ? [{ id: customer.value.id, name: customer.value.name }] : [],
    contacts: contact?.ok
      ? [
          {
            ...{ id: contact.value.id, name: contact.value.name },
            ...{ customerId: contact.value.customerId, email: contact.value.email },
            phone: contact.value.phone,
          },
        ]
      : [],
    customersHidden: hidden,
  };
}

/** The organization's order statuses, read once per request (ADR 0097 §3). */
export const loadOrderStatuses = cache(async (): Promise<Result<OrderFormData["statuses"]>> => {
  const result = await runOperation({ operation: listOrderStatuses, input: { limit: 100 } });
  return result.ok ? { ok: true, value: result.value.items } : result;
});
