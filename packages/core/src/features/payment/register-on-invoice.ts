import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { findProvider } from "../../providers/registry";
import { conflict } from "../../shared/errors";
import { type ProviderInvoice, paymentKeyOf } from "../invoice/invoice-payment-signal";
import { invoiceProviderCall } from "../invoice/invoice-provider";

type InvoiceAt = Pick<ProviderInvoice, "provider">;

/**
 * The ledger guard (ADR 0100): an invoice raised in a provider that keeps the books only takes
 * payments that provider can book. CONFLICT when it cannot register one taken elsewhere.
 */
export function checkLedgerAccepts({
  invoice,
}: {
  invoice: { provider: InvoiceAt["provider"] | null };
}): Result<true> {
  if (!invoice.provider) return ok({ value: true });
  const adapter = findProvider({ key: invoice.provider });
  if (!adapter?.ledger || adapter.invoicing?.registerPayment) return ok({ value: true });
  return conflict({
    message: `The invoice is booked in ${invoice.provider}, which receives its payments; record the payment there`,
  });
}

export type RegisterOnInvoiceInput = { context: OperationContext; paymentId: string };

/**
 * Books a settled payment on the invoice it pays when that invoice lives in a ledger provider
 * that can register payments (ADR 0100), after the commit. The booking is kept as a SUCCEEDED
 * attempt under the same key the provider's own payment list uses, so a later sync finds it and
 * adds nothing. Anything else, or a payment already booked, is a no-op.
 */
export async function registerOnInvoice({
  context,
  paymentId,
}: RegisterOnInvoiceInput): Promise<Result<true>> {
  const payment = await context.db.payment.findFirst({
    where: { id: paymentId, status: "SUCCEEDED" },
    include: { invoice: true },
  });
  const invoice = payment?.invoice;
  if (!payment || !invoice?.provider || !invoice.providerReference) return ok({ value: true });
  if (payment.provider === invoice.provider) return ok({ value: true });
  const register = findProvider({ key: invoice.provider })?.invoicing?.registerPayment;
  if (!register) return ok({ value: true });
  const booked = await context.db.paymentAttempt.count({
    where: { paymentId, provider: invoice.provider },
  });
  if (booked > 0) return ok({ value: true });
  const call = await invoiceProviderCall({ context, invoice });
  if (!call.ok) return call;
  const done = await register({
    auth: call.value.auth,
    providerReference: invoice.providerReference,
    payment: {
      reference: payment.id,
      amountMinor: payment.amountMinor,
      paidAt: payment.paidAt ?? new Date(),
    },
  });
  if (!done.ok) return done;
  const target = { ...invoice, provider: invoice.provider };
  const key = paymentKeyOf({
    invoice: target,
    organizationId: context.organizationId,
    reference: done.value.providerReference,
  });
  await context.db.paymentAttempt.create({
    data: {
      organizationId: context.organizationId,
      paymentId,
      method: payment.method,
      provider: invoice.provider,
      connectionId: invoice.connectionId,
      providerReference: key,
      status: "SUCCEEDED",
    },
  });
  return ok({ value: true });
}
