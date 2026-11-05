import type { Customer } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import type { PaymentMethod } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type ChargeTarget = {
  order: { id: string; reference: number };
  customer: Customer;
  connectedAccountId: string;
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

export type LoadTargetInput = Db & { orderId: string; method: PaymentMethod };

/**
 * What a new payment needs: a chargeable order, its customer (with an email for invoices) and
 * the organization's connected account with card payments active.
 */
export async function loadChargeTarget({
  context,
  orderId,
  method,
}: LoadTargetInput): Promise<Result<ChargeTarget>> {
  const order = await loadChargeableOrder({ context, orderId });
  if (!order.ok) return order;
  const account = await context.db.paymentAccount.findFirst({});
  if (account?.status !== "ACTIVE" || !account.stripeAccountId || account.disconnectedAt) {
    return conflict({
      message: "The payment account is not active; finish Stripe onboarding in settings first",
    });
  }
  const customer = await context.db.customer.findFirst({
    where: { id: order.value.customerId, status: { in: ["ACTIVE", "ARCHIVED"] } },
  });
  if (!customer) return notFound({ entity: "Customer" });
  if (method === "INVOICE" && !customer.email) {
    return conflict({
      message: "The customer has no email address to send the invoice to",
      issues: [{ path: "method", message: "The customer has no email address" }],
    });
  }
  const { id, reference } = order.value;
  return ok({
    value: { order: { id, reference }, customer, connectedAccountId: account.stripeAccountId },
  });
}
