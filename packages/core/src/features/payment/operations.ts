import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { createPayment } from "./create-operation";
import {
  PaymentIdInputSchema,
  PaymentListInputSchema,
  PaymentListOutputSchema,
  PaymentSchema,
} from "./schema";
import { toPaymentDto } from "./to-payment-dto";

export const listPayments = defineOperation({
  name: "payment.list",
  kind: "query",
  description:
    "Payments requested for a booking, newest first: method (CARD or INVOICE), status, amount " +
    "in minor units, currency and the customer's payment link.",
  input: PaymentListInputSchema,
  output: PaymentListOutputSchema,
  permission: "payment:read",
  handler: async ({ input: { bookingId, limit, cursor }, context }) => {
    const rows = await context.db.payment.findMany({
      where: { bookingId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...pageArgs({ limit, cursor }),
    });
    const page = paginate({ rows, limit });
    return ok({
      value: { items: page.items.map((row) => toPaymentDto({ row })), nextCursor: page.nextCursor },
    });
  },
});

export const getPayment = defineOperation({
  name: "payment.get",
  kind: "query",
  description: "Get one payment by id: method, status, amount, payment link and when it was paid.",
  input: PaymentIdInputSchema,
  output: PaymentSchema,
  permission: "payment:read",
  handler: async ({ input, context }) => {
    const row = await context.db.payment.findFirst({ where: { id: input.id } });
    return row ? ok({ value: toPaymentDto({ row }) }) : notFound({ entity: "Payment" });
  },
});

export { createPayment };

/** Payments requested from customers, charged on the venue's connected account (ADR 0028, 0029). */
export const paymentOperations = [listPayments, getPayment, createPayment];
