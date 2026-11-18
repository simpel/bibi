import "server-only";
import { getContact, getCustomer, type OrderDto } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import { loadOrderStatuses } from "../load-order-names";

/**
 * The key facts the order page shows under its title, for the sheet: none where the caller may
 * not read them (ADR 0050).
 */
export type OrderSheetFacts = {
  status: { name: string; color: string } | null;
  customer: { id: string; name: string } | null;
  contact: SheetPerson | null;
  desiredStartsAt: Date | null;
  desiredEndsAt: Date | null;
  estimatedHeadcount: number | null;
  guaranteedHeadcount: number | null;
};

/** A person with the ways to reach them, for their contact card. */
export type SheetPerson = { name: string; email: string | null; phone?: string | null };

/** The order's status, who it is for and who to talk to there, and its dates and headcounts. */
export async function loadSheetFacts({ order }: { order: OrderDto }): Promise<OrderSheetFacts> {
  const { customerId, contactId } = order;
  const [statuses, customer, contact] = await Promise.all([
    loadOrderStatuses(),
    runOperation({ operation: getCustomer, input: { id: customerId } }),
    contactId ? runOperation({ operation: getContact, input: { id: contactId } }) : null,
  ]);
  const status = statuses.ok ? statuses.value.find(({ id }) => id === order.statusId) : undefined;
  return {
    status: status ? { name: status.name, color: status.color } : null,
    customer: customer.ok ? { id: customer.value.id, name: customer.value.name } : null,
    contact: contact?.ok
      ? { name: contact.value.name, email: contact.value.email, phone: contact.value.phone }
      : null,
    desiredStartsAt: order.desiredStartsAt,
    desiredEndsAt: order.desiredEndsAt,
    estimatedHeadcount: order.estimatedHeadcount,
    guaranteedHeadcount: order.guaranteedHeadcount,
  };
}
