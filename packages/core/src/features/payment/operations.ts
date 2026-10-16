import { type Db, getDb } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { defineOperation } from "../../operations/define-operation";
import { execute } from "../../operations/execute";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { createPayment } from "./create-operation";
import { getPublicPaymentOperation } from "./public-operation";
import { PublicTokenSchema } from "./public-token";
import {
  PaymentIdInputSchema,
  PaymentListInputSchema,
  PaymentListOutputSchema,
  PaymentSchema,
  type PublicPaymentDto,
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

export type GetPublicPaymentInput = { token: string; db?: Db };

/**
 * The one cross-organization lookup of the public payment page (ADR 0004): which organization
 * owns the payment behind a token. It only reads that id, which then pins the SYSTEM context the
 * read runs in. A malformed, unknown or foreign token is the same `NOT_FOUND`.
 */
export async function getPublicPayment({
  token,
  db = getDb(),
}: GetPublicPaymentInput): Promise<Result<PublicPaymentDto>> {
  if (!PublicTokenSchema.safeParse(token).success) return notFound({ entity: "Payment" });
  const row = await db.payment.findUnique({
    where: { publicToken: token },
    select: { organizationId: true },
  });
  if (!row) return notFound({ entity: "Payment" });
  const context = createExecuteContext({
    organizationId: row.organizationId,
    roles: [],
    permissions: { payment: ["read"] },
    actor: { type: "system", userId: null },
    db,
  });
  return execute({ operation: getPublicPaymentOperation, input: { token }, context });
}

/** Payments requested from customers, charged on the venue's connected account (ADR 0028, 0029). */
export const paymentOperations = [listPayments, getPayment, createPayment];
