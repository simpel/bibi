import type { Customer } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { type Route, resolveRoute } from "../../providers/resolve-route";
import { conflict, notFound } from "../../shared/errors";
import type { PaymentCreateMethod } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type ChargeTarget = {
  order: { id: string; reference: number };
  customer: Customer;
  /** The method prepared first, and the provider and connection that take it. */
  method: PaymentCreateMethod;
  route: Route;
};

export type ChargeableOrderInput = Db & { orderId: string };

/** An order can be charged unless it is in a `closes` status that is not `invoiceable`. */
export async function loadChargeableOrder({ context, orderId }: ChargeableOrderInput) {
  const order = await context.db.order.findFirst({ where: { id: orderId } });
  if (!order) return notFound({ entity: "Order" });
  const orderStatus = await context.db.orderStatus.findFirst({
    where: { id: order.statusId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { closes: true, invoiceable: true, name: true },
  });
  if (orderStatus?.closes && !orderStatus.invoiceable) {
    return conflict({ message: `An order in "${orderStatus.name}" cannot be charged` });
  }
  return ok({ value: order });
}

export type CollectRoute = { method: PaymentCreateMethod; route: Route };

const COLLECT_METHODS: readonly PaymentCreateMethod[] = ["CARD", "SWISH"];

/**
 * The methods a customer can pay a requested payment with (ADR 0100): each one routed to a
 * connected provider that collects it, in the order card, Swish. A route to a provider that is not
 * connected is a CONFLICT, never a silent switch.
 */
export async function routedMethods({ context }: Db): Promise<Result<CollectRoute[]>> {
  const routes: CollectRoute[] = [];
  for (const method of COLLECT_METHODS) {
    const route = await resolveRoute({ context, method });
    if (!route.ok) return route;
    if (route.value?.adapter.collect?.methods.includes(method)) {
      routes.push({ method, route: route.value });
    }
  }
  return ok({ value: routes });
}

export type LoadTargetInput = Db & { orderId: string; method: PaymentCreateMethod | undefined };

/** The method to prepare first: the one asked for, else the first routed one. */
async function chosenRoute({ context, method }: Db & { method: PaymentCreateMethod | undefined }) {
  const routes = await routedMethods({ context });
  if (!routes.ok) return routes;
  const chosen = method ? routes.value.find((r) => r.method === method) : routes.value[0];
  if (chosen) return ok({ value: chosen });
  return conflict({
    message: method
      ? `No connected provider takes ${method} payments. Connect one in Administration → Integrations.`
      : "No payment operator is connected. Connect one in Administration → Integrations.",
    ...(method ? { issues: [{ path: "method", message: `${method} is not available` }] } : {}),
  });
}

/** The chargeable order, its customer and the route the payment is first prepared on. */
export async function loadChargeTarget({
  context,
  orderId,
  method,
}: LoadTargetInput): Promise<Result<ChargeTarget>> {
  const order = await loadChargeableOrder({ context, orderId });
  if (!order.ok) return order;
  const chosen = await chosenRoute({ context, method });
  if (!chosen.ok) return chosen;
  const customer = await context.db.customer.findFirst({
    where: { id: order.value.customerId, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });
  if (!customer) return notFound({ entity: "Customer" });
  const { id, reference } = order.value;
  return ok({
    value: {
      order: { id, reference },
      customer,
      method: chosen.value.method,
      route: chosen.value.route,
    },
  });
}
