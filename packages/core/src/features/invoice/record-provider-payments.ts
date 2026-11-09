import type { Invoice } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { ProviderKey } from "../../providers/provider-keys";
import type { ProviderSignal } from "../../providers/signal";
import type { ProviderPayment } from "../../providers/types";
import { newPublicToken } from "../payment/public-token";
import { PAYMENT_INCLUDE, type PaymentRow, toPaymentDto } from "../payment/to-payment-dto";

type Context = Pick<OperationContext, "db" | "organizationId" | "actor" | "recordChange">;
type ProviderInvoice = Pick<Invoice, "id" | "orderId" | "currency" | "connectionId"> & {
  provider: ProviderKey;
};

/** The attempt reference of a payment booked at the provider: unique per provider. */
const referenceOf = ({
  invoice,
  organizationId,
  reference,
}: {
  invoice: ProviderInvoice;
  organizationId: string;
  reference: string;
}) => `${invoice.provider.toLowerCase()}:${organizationId}:${reference}`;

type SignalInput = {
  context: Context;
  invoice: ProviderInvoice;
  signal: ProviderSignal;
  before?: PaymentRow;
};

async function recordPayment({ context, invoice, signal, before }: SignalInput) {
  const amountMinor = signal.amountMinor ?? 0;
  if (before?.status === "SUCCEEDED" && before.amountMinor === amountMinor) return;
  const data = { status: "SUCCEEDED" as const, amountMinor, paidAt: signal.occurredAt };
  const { organizationId } = context;
  const { provider, connectionId } = invoice;
  const created = before
    ? null
    : await context.db.payment.create({
        data: {
          ...data,
          ...{ organizationId, orderId: invoice.orderId, invoiceId: invoice.id },
          ...{ method: "INVOICE", provider, connectionId, currency: invoice.currency },
          publicToken: newPublicToken(),
          createdBy: context.actor.userId,
        },
      });
  if (created) {
    await context.db.paymentAttempt.create({
      data: {
        ...{ organizationId, paymentId: created.id, method: "INVOICE", provider, connectionId },
        providerReference: signal.reference ?? null,
        status: "SUCCEEDED",
        createdBy: context.actor.userId,
      },
    });
  }
  const id = before?.id ?? created?.id ?? "";
  const row = await context.db.payment.update({ where: { id }, data, include: PAYMENT_INCLUDE });
  const prior = before ? { before: toPaymentDto({ row: before }) } : {};
  context.recordChange({ entityId: row.id, ...prior, after: toPaymentDto({ row }) });
}

async function removePayment({ context, before }: { context: Context; before: PaymentRow }) {
  if (before.status === "CANCELLED") return;
  const where = { paymentId: before.id, status: "SUCCEEDED" as const };
  await context.db.paymentAttempt.updateMany({ where, data: { status: "CANCELLED" } });
  const row = await context.db.payment.update({
    where: { id: before.id },
    data: { status: "CANCELLED" },
    include: PAYMENT_INCLUDE,
  });
  const change = { before: toPaymentDto({ row: before }), after: toPaymentDto({ row }) };
  context.recordChange({ entityId: row.id, ...change });
}

/**
 * Applies an `invoice.payment_recorded` or `invoice.payment_removed` signal (ADR 0100): a booked
 * payment becomes a SUCCEEDED INVOICE payment with one SUCCEEDED attempt keyed by the provider's
 * payment number; a changed one is updated; a removed one is CANCELLED. A repeat changes nothing.
 */
export async function applyInvoicePaymentSignal({ context, invoice, signal, before }: SignalInput) {
  if (signal.kind === "invoice.payment_recorded") {
    await recordPayment({ context, invoice, signal, ...(before ? { before } : {}) });
  } else if (signal.kind === "invoice.payment_removed" && before) {
    await removePayment({ context, before });
  }
}

export type RecordProviderPaymentsInput = {
  context: Context;
  invoice: ProviderInvoice;
  /** Every payment the provider has booked on the invoice now. */
  payments: readonly ProviderPayment[];
};

/**
 * Mirrors the payments a ledger provider booked on its invoice (ADR 0090, 0100) through the signal
 * path: each listed payment is an `invoice.payment_recorded` signal, each stored one the provider
 * no longer lists an `invoice.payment_removed` signal.
 */
export async function recordProviderPayments({
  context,
  invoice,
  payments,
}: RecordProviderPaymentsInput) {
  const { organizationId } = context;
  const stored = await context.db.payment.findMany({
    where: { invoiceId: invoice.id, provider: invoice.provider },
    include: { attempts: { where: { provider: invoice.provider } } },
  });
  const byReference = new Map(
    stored.flatMap((row) => row.attempts.map((a) => [a.providerReference, row] as const)),
  );
  const base = { provider: invoice.provider, externalAccountId: null };
  const seen = new Set<string>();
  for (const payment of payments) {
    const reference = referenceOf({ invoice, organizationId, reference: payment.reference });
    seen.add(reference);
    const signal: ProviderSignal = {
      ...base,
      eventId: reference,
      kind: "invoice.payment_recorded",
      reference,
      amountMinor: payment.amountMinor,
      occurredAt: payment.paidAt,
    };
    const before = byReference.get(reference);
    await applyInvoicePaymentSignal({ context, invoice, signal, ...(before ? { before } : {}) });
  }
  for (const [reference, before] of byReference) {
    if (!reference || seen.has(reference)) continue;
    const signal: ProviderSignal = {
      ...base,
      eventId: reference,
      kind: "invoice.payment_removed",
      reference,
      occurredAt: new Date(),
    };
    await applyInvoicePaymentSignal({ context, invoice, signal, before });
  }
}
