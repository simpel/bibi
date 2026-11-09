import {
  cancelPayment,
  createPayment,
  getOrderBalance,
  getPayment,
  listPayments,
  type OrderBalanceDto,
  OrderBalanceSchema,
  type PaymentDto,
  PaymentSchema,
  type ReceivableSettlement,
  ReceivableSettlementSchema,
  recordManualPayment,
  refundPayment,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { type Page, pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { OrderRef } from "../order/graphql";

export const PaymentRef = objectFromSchema<PaymentDto>({
  name: "Payment",
  schema: PaymentSchema,
  omit: ["organizationId"],
  description:
    "A payment requested from an order's customer and paid by card or Swish through the " +
    "routed provider, or recorded by staff (MANUAL), with its refunds (ADR 0100).",
});
const PaymentPageRef = pageType({ name: "PaymentPage", item: PaymentRef });

fieldFromOperation({ operation: listPayments, type: PaymentPageRef, name: "payments" });
fieldFromOperation({ operation: getPayment, type: PaymentRef, name: "payment" });
for (const operation of [createPayment, refundPayment, cancelPayment, recordManualPayment]) {
  mutationFromOperation({ operation, type: PaymentRef });
}

const ReceivableSettlementRef = objectFromSchema<ReceivableSettlement>({
  name: "ReceivableSettlement",
  schema: ReceivableSettlementSchema,
  description: "A quote, deposit or invoice with what is paid against it (derived, ADR 0057).",
});

const OrderBalanceRef = objectFromSchema<OrderBalanceDto>({
  name: "OrderBalance",
  schema: OrderBalanceSchema,
  omit: ["receivables"],
  description: "What an order owes, derived from its receivables and payments (ADR 0057).",
});

builder.objectField(OrderBalanceRef, "receivables", (t) =>
  t.field({
    type: [ReceivableSettlementRef],
    description: "Each receivable with its amount, paid, open and progress.",
    resolve: (balance) => balance.receivables,
  }),
);

fieldFromOperation({ operation: getOrderBalance, type: OrderBalanceRef, name: "orderBalance" });

// Graph edge. Goes through `payment.list`, so its permission applies here too.
builder.objectField(OrderRef, "payments", (t) =>
  t.field({
    type: [PaymentRef],
    description: "Payments requested for the order, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (order, { limit }, ctx) => {
      const input = { orderId: order.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
      const page = (await runOperation({
        operation: listPayments,
        input,
        ctx,
      })) as Page<PaymentDto>;
      return page.items;
    },
  }),
);
