import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { invoiceProviderCall, raisedInProvider } from "./invoice-provider";
import { issueInProvider } from "./issue-in-provider";
import { recordProviderPayments } from "./record-provider-payments";
import { type InvoiceDto, InvoiceIdInputSchema, InvoiceSchema } from "./schema";
import { loadInvoice } from "./to-invoice-dto";

type SyncInput = { context: OperationContext; invoice: InvoiceDto };

/**
 * Brings an invoice raised in a provider up to date (ADR 0090, 0100): raises it when sending did
 * not reach the provider, then mirrors the payments booked on it through the signal path. Called
 * after the commit only.
 */
export async function syncWithProvider({
  context,
  invoice,
}: SyncInput): Promise<Result<InvoiceDto>> {
  const raised = await issueInProvider({ context, invoiceId: invoice.id });
  if (!raised.ok) return raised;
  const row = await context.db.invoice.findFirst({ where: { id: invoice.id } });
  if (!row?.provider) return notFound({ entity: "Invoice" });
  const call = await invoiceProviderCall({ context, invoice: row });
  if (!call.ok) return call;
  const { invoicing, auth } = call.value;
  const payments = await invoicing.listPayments({ auth, providerReference: raised.value });
  if (!payments.ok) return payments;
  const target = { ...row, provider: row.provider };
  const recorded = await recordProviderPayments({
    context,
    invoice: target,
    payments: payments.value,
  });
  if (!recorded.ok) return recorded;
  const after = await loadInvoice({ context, id: invoice.id });
  return after ? ok({ value: after }) : notFound({ entity: "Invoice" });
}

export const syncInvoice = defineOperation({
  name: "invoice.sync",
  kind: "command",
  description:
    "Bring a SENT invoice raised at a provider (an accounting system, or the " +
    "payment operator's invoicing) up to date (ADR 0090, 0100): raise it there if sending did " +
    "not reach it, then read the payments booked on " +
    "it. Bibi also does this by itself when the provider reports a payment; use it to refresh " +
    "now. CONFLICT for an invoice that is not SENT or not raised in such a provider.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  // May raise and email the invoice when sending did not reach the provider: the AI asks first.
  handler: async ({ input, context }) => {
    const invoice = await loadInvoice({ context, id: input.id });
    if (!invoice) return notFound({ entity: "Invoice" });
    if (invoice.status !== "SENT" || !raisedInProvider({ invoice })) {
      return conflict({ message: "Only a SENT invoice raised in a provider can be synced" });
    }
    return ok({ value: invoice });
  },
  external: ({ output, context }) => syncWithProvider({ context, invoice: output }),
});
