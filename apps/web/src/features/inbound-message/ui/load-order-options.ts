import "server-only";
import { listCustomers, listOrders } from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import { orderName } from "@/lib/order-label";
import { runOperation } from "@/server/run-operation";

const LIMIT = 50;

/**
 * The latest active orders to attach a message to, as `<title> · <customer>` (`#<reference>` for
 * an untitled order); without `customer:read` only the title or reference. Empty without `order:read`.
 */
export async function loadOrderOptions(): Promise<NamedOption[]> {
  const [orders, customers] = await Promise.all([
    runOperation({ operation: listOrders, input: { limit: LIMIT } }),
    runOperation({ operation: listCustomers, input: { limit: 100 } }),
  ]);
  if (!orders.ok) return [];
  const names = new Map(customers.ok ? customers.value.items.map((c) => [c.id, c.name]) : []);
  return orders.value.items.map((order) => {
    const customer = names.get(order.customerId);
    const label = orderName({ title: order.title, fallback: `#${order.reference}` });
    return { id: order.id, name: customer ? `${label} · ${customer}` : label };
  });
}
