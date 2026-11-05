import type { Payment } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { FortnoxPayment } from "../integration/fortnox/invoicing-gateway";
import { newPublicToken } from "../payment/public-token";
import { toPaymentDto } from "../payment/to-payment-dto";

type Context = Pick<OperationContext, "db" | "organizationId" | "actor" | "recordChange">;
type Invoice = { id: string; orderId: string; currency: string };

export type RecordFortnoxPaymentsInput = {
  context: Context;
  invoice: Invoice;
  /** Every payment Fortnox has booked on the invoice now. */
  payments: readonly FortnoxPayment[];
};

const referenceOf = ({ organizationId, number }: { organizationId: string; number: string }) =>
  `fortnox:${organizationId}:${number}`;

type UpsertInput = {
  context: Context;
  invoice: Invoice;
  payment: FortnoxPayment;
  before?: Payment;
};

/** One booked payment as a SUCCEEDED INVOICE payment; unchanged ones are left alone. */
async function upsertPayment({ context, invoice, payment, before }: UpsertInput) {
  const { organizationId } = context;
  const data = {
    status: "SUCCEEDED" as const,
    amountMinor: payment.amountMinor,
    paidAt: payment.paidAt,
  };
  if (before?.status === "SUCCEEDED" && before.amountMinor === payment.amountMinor) return;
  const providerReference = referenceOf({ organizationId, number: payment.number });
  const row = before
    ? await context.db.payment.update({ where: { id: before.id }, data })
    : await context.db.payment.create({
        data: {
          ...data,
          ...{ organizationId, orderId: invoice.orderId, invoiceId: invoice.id },
          ...{ method: "INVOICE", provider: "FORTNOX", providerReference },
          ...{ currency: invoice.currency, publicToken: newPublicToken() },
          createdBy: context.actor.userId,
        },
      });
  const prior = before ? { before: toPaymentDto({ row: before }) } : {};
  context.recordChange({ entityId: row.id, ...prior, after: toPaymentDto({ row }) });
}

/**
 * Mirrors the payments booked on a Fortnox invoice (ADR 0090): a new one becomes a SUCCEEDED
 * INVOICE payment, a changed one is updated, one no longer in Fortnox is CANCELLED. Keyed on
 * Fortnox's payment number, so a repeated event or refresh changes nothing.
 */
export async function recordFortnoxPayments({
  context,
  invoice,
  payments,
}: RecordFortnoxPaymentsInput): Promise<void> {
  const { organizationId } = context;
  const stored = await context.db.payment.findMany({
    where: { invoiceId: invoice.id, provider: "FORTNOX" },
  });
  const byReference = new Map(stored.map((row) => [row.providerReference, row]));
  const seen = new Set(payments.map((p) => referenceOf({ organizationId, number: p.number })));
  for (const payment of payments) {
    const before = byReference.get(referenceOf({ organizationId, number: payment.number }));
    await upsertPayment({ context, invoice, payment, ...(before ? { before } : {}) });
  }
  for (const before of stored) {
    if (seen.has(before.providerReference ?? "") || before.status === "CANCELLED") continue;
    const row = await context.db.payment.update({
      where: { id: before.id },
      data: { status: "CANCELLED" },
    });
    const change = { before: toPaymentDto({ row: before }), after: toPaymentDto({ row }) };
    context.recordChange({ entityId: row.id, ...change });
  }
}
