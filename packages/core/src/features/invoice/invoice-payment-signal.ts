import type { Invoice } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { ProviderKey } from "../../providers/provider-keys";
import type { ProviderSignal } from "../../providers/signal";
import { newPublicToken } from "../payment/public-token";
import { PAYMENT_INCLUDE, type PaymentRow, toPaymentDto } from "../payment/to-payment-dto";

type Context = Pick<OperationContext, "db" | "organizationId" | "actor" | "recordChange">;

/**
 * A document raised in a provider whose payments it books: an invoice, or a deposit's prepayment
 * invoice (`kind: "deposit"`, ADR 0106).
 */
export type ProviderInvoice = Pick<Invoice, "id" | "orderId" | "currency" | "connectionId"> & {
  provider: ProviderKey;
  kind?: "invoice" | "deposit";
};

/** The payment column that points at the document. */
export const paymentOwnerOf = ({ invoice }: { invoice: Pick<ProviderInvoice, "id" | "kind"> }) =>
  invoice.kind === "deposit" ? { depositId: invoice.id } : { invoiceId: invoice.id };

export type PaymentKeyInput = {
  invoice: ProviderInvoice;
  organizationId: string;
  reference: string;
};

/** The attempt reference of a payment booked at the provider: unique per provider. */
export const paymentKeyOf = ({ invoice, organizationId, reference }: PaymentKeyInput) =>
  `${invoice.provider.toLowerCase()}:${organizationId}:${reference}`;

export type InvoicePaymentOutcome = { payment: PaymentRow | null; changed: boolean };

type SignalInput = { context: Context; invoice: ProviderInvoice; signal: ProviderSignal };

/** The invoice's payment the provider booked under this reference, whoever requested it. */
export async function findBookedPayment({ context, invoice, signal }: SignalInput) {
  const key = paymentKeyOf({
    invoice,
    organizationId: context.organizationId,
    reference: signal.reference ?? "",
  });
  const attempt = await context.db.paymentAttempt.findFirst({
    where: {
      provider: invoice.provider,
      providerReference: key,
      payment: paymentOwnerOf({ invoice }),
    },
    select: { paymentId: true },
  });
  const before = attempt
    ? await context.db.payment.findFirst({
        where: { id: attempt.paymentId },
        include: PAYMENT_INCLUDE,
      })
    : null;
  return { key, before };
}

async function createBooked({ context, invoice, signal, key }: SignalInput & { key: string }) {
  const { organizationId } = context;
  const { provider, connectionId } = invoice;
  const created = await context.db.payment.create({
    data: {
      ...{ organizationId, orderId: invoice.orderId, ...paymentOwnerOf({ invoice }) },
      ...{ method: "INVOICE", provider, connectionId, currency: invoice.currency },
      status: "SUCCEEDED",
      amountMinor: signal.amountMinor ?? 0,
      paidAt: signal.occurredAt,
      publicToken: newPublicToken(),
      createdBy: context.actor.userId,
    },
  });
  await context.db.paymentAttempt.create({
    data: {
      ...{ organizationId, paymentId: created.id, method: "INVOICE", provider, connectionId },
      providerReference: key,
      status: "SUCCEEDED",
      createdBy: context.actor.userId,
    },
  });
  return context.db.payment.findFirstOrThrow({
    where: { id: created.id },
    include: PAYMENT_INCLUDE,
  });
}

/** A booked payment: new, or its amount changed at the provider. A repeat changes nothing. */
async function recordPayment({
  context,
  invoice,
  signal,
}: SignalInput): Promise<InvoicePaymentOutcome> {
  const input = { context, invoice, signal };
  const { key, before } = await findBookedPayment(input);
  const amountMinor = signal.amountMinor ?? 0;
  if (!before) {
    const row = await createBooked({ ...input, key });
    context.recordChange({ entityId: row.id, after: toPaymentDto({ row }) });
    return { payment: row, changed: true };
  }
  if (before.status === "SUCCEEDED" && before.amountMinor === amountMinor) {
    return { payment: before, changed: false };
  }
  // A payment Bibi booked there itself (registerPayment) keeps its own amount and method.
  if (before.method !== "INVOICE") return { payment: before, changed: false };
  const row = await context.db.payment.update({
    where: { id: before.id },
    data: { status: "SUCCEEDED", amountMinor, paidAt: signal.occurredAt },
    include: PAYMENT_INCLUDE,
  });
  const change = { before: toPaymentDto({ row: before }), after: toPaymentDto({ row }) };
  context.recordChange({ entityId: row.id, ...change });
  return { payment: row, changed: true };
}

async function removePayment({
  context,
  invoice,
  signal,
}: SignalInput): Promise<InvoicePaymentOutcome> {
  const input = { context, invoice, signal };
  const { before } = await findBookedPayment(input);
  if (!before || before.status === "CANCELLED" || before.method !== "INVOICE") {
    return { payment: before, changed: false };
  }
  const where = { paymentId: before.id, status: "SUCCEEDED" as const };
  await context.db.paymentAttempt.updateMany({ where, data: { status: "CANCELLED" } });
  const row = await context.db.payment.update({
    where: { id: before.id },
    data: { status: "CANCELLED" },
    include: PAYMENT_INCLUDE,
  });
  const change = { before: toPaymentDto({ row: before }), after: toPaymentDto({ row }) };
  context.recordChange({ entityId: row.id, ...change });
  return { payment: row, changed: true };
}

/**
 * Applies an `invoice.payment_recorded` or `invoice.payment_removed` signal (ADR 0100): a booked
 * payment becomes a SUCCEEDED INVOICE payment with one SUCCEEDED attempt keyed by the provider's
 * payment reference; a changed one is updated; a removed one is CANCELLED. A repeat changes nothing.
 */
export function applyInvoicePaymentSignal({
  context,
  invoice,
  signal,
}: SignalInput): Promise<InvoicePaymentOutcome> {
  const input = { context, invoice, signal };
  return signal.kind === "invoice.payment_removed" ? removePayment(input) : recordPayment(input);
}
