import {
  createPayment,
  getPayment,
  getTicketBalance,
  listPayments,
  type PaymentDto,
  PaymentSchema,
  type ReceivableSettlement,
  ReceivableSettlementSchema,
  type TicketBalanceDto,
  TicketBalanceSchema,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { type Page, pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { TicketRef } from "../ticket/graphql";

export const PaymentRef = objectFromSchema<PaymentDto>({
  name: "Payment",
  schema: PaymentSchema,
  omit: ["organizationId"],
  description:
    "A payment requested from a ticket's customer (card checkout or Stripe invoice), charged " +
    "directly on the organization's Stripe account.",
});
const PaymentPageRef = pageType({ name: "PaymentPage", item: PaymentRef });

fieldFromOperation({ operation: listPayments, type: PaymentPageRef, name: "payments" });
fieldFromOperation({ operation: getPayment, type: PaymentRef, name: "payment" });
mutationFromOperation({ operation: createPayment, type: PaymentRef });

const ReceivableSettlementRef = objectFromSchema<ReceivableSettlement>({
  name: "ReceivableSettlement",
  schema: ReceivableSettlementSchema,
  description: "A quote, deposit or invoice with what is paid against it (derived, ADR 0057).",
});

const TicketBalanceRef = objectFromSchema<TicketBalanceDto>({
  name: "TicketBalance",
  schema: TicketBalanceSchema,
  omit: ["receivables"],
  description: "What a ticket owes, derived from its receivables and payments (ADR 0057).",
});

builder.objectField(TicketBalanceRef, "receivables", (t) =>
  t.field({
    type: [ReceivableSettlementRef],
    description: "Each receivable with its amount, paid, open and progress.",
    resolve: (balance) => balance.receivables,
  }),
);

fieldFromOperation({ operation: getTicketBalance, type: TicketBalanceRef, name: "ticketBalance" });

// Graph edge. Goes through `payment.list`, so its permission applies here too.
builder.objectField(TicketRef, "payments", (t) =>
  t.field({
    type: [PaymentRef],
    description: "Payments requested for the ticket, newest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const input = { ticketId: ticket.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) };
      const page = (await runOperation({
        operation: listPayments,
        input,
        ctx,
      })) as Page<PaymentDto>;
      return page.items;
    },
  }),
);
