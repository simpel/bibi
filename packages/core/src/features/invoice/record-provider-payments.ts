import { getDb } from "@bibi/db";
import { err, ok, type Result } from "../../errors/result";
import { execute } from "../../operations/execute";
import type { OperationContext } from "../../operations/types";
import type { ProviderSignal } from "../../providers/signal";
import { providerSystemContext } from "../../providers/system-context";
import type { ProviderPayment } from "../../providers/types";
import { applyInvoiceSignal } from "./apply-signal-operation";
import { type ProviderInvoice, paymentKeyOf } from "./invoice-payment-signal";

export type RecordProviderPaymentsInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  invoice: ProviderInvoice;
  /** Every payment the provider has booked on the invoice now. */
  payments: readonly ProviderPayment[];
};

/** The provider references of the invoice's booked payments (the part after the key prefix). */
async function storedReferences({
  context,
  invoice,
}: Omit<RecordProviderPaymentsInput, "payments">) {
  const prefix = paymentKeyOf({ invoice, organizationId: context.organizationId, reference: "" });
  const attempts = await context.db.paymentAttempt.findMany({
    where: {
      provider: invoice.provider,
      providerReference: { startsWith: prefix },
      payment: { invoiceId: invoice.id, status: "SUCCEEDED", method: "INVOICE" },
    },
    select: { providerReference: true },
  });
  return attempts.flatMap((a) =>
    a.providerReference ? [a.providerReference.slice(prefix.length)] : [],
  );
}

/**
 * Mirrors the payments a provider booked on its invoice (ADR 0090, 0100) through the signal path:
 * each listed payment is an `invoice.payment_recorded` signal, each stored one the provider no
 * longer lists an `invoice.payment_removed` signal, each applied as SYSTEM by `invoice.applySignal`
 * (which notifies the order's people of a new payment).
 */
export async function recordProviderPayments({
  context,
  invoice,
  payments,
}: RecordProviderPaymentsInput): Promise<Result<true>> {
  const system = providerSystemContext({ db: getDb(), organizationId: context.organizationId });
  const base = { provider: invoice.provider, externalAccountId: null };
  const signals: ProviderSignal[] = payments.map((payment) => ({
    ...base,
    eventId: payment.reference,
    kind: "invoice.payment_recorded",
    reference: payment.reference,
    amountMinor: payment.amountMinor,
    occurredAt: payment.paidAt,
  }));
  const listed = new Set(payments.map((payment) => payment.reference));
  for (const reference of await storedReferences({ context, invoice })) {
    if (listed.has(reference)) continue;
    signals.push({
      ...base,
      eventId: reference,
      kind: "invoice.payment_removed",
      reference,
      occurredAt: new Date(),
    });
  }
  for (const signal of signals) {
    const input = { invoiceId: invoice.id, signal };
    const applied = await execute({ operation: applyInvoiceSignal, input, context: system });
    if (!applied.ok) return err({ error: applied.error });
  }
  return ok({ value: true });
}
