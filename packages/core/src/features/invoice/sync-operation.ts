import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { getFortnoxAccessToken } from "../integration/fortnox/access-token";
import { getFortnoxInvoicingGateway } from "../integration/fortnox/invoicing-registry";
import { recordFortnoxPayments } from "./fortnox-payments";
import { raiseInFortnox } from "./raise-in-fortnox";
import { type InvoiceDto, InvoiceIdInputSchema, InvoiceSchema } from "./schema";
import { loadInvoice } from "./to-invoice-dto";

type SyncInput = { context: OperationContext; invoice: InvoiceDto };

/**
 * Brings a Fortnox invoice up to date (ADR 0090): raises it when sending did not reach Fortnox,
 * then mirrors the payments booked on it. Called after the commit only.
 */
export async function syncWithFortnox({
  context,
  invoice,
}: SyncInput): Promise<Result<InvoiceDto>> {
  const raised = await raiseInFortnox({ context, invoiceId: invoice.id });
  if (!raised.ok) return raised;
  const token = await getFortnoxAccessToken({ context });
  if (!token.ok) return token;
  const payments = await getFortnoxInvoicingGateway().listPayments({
    accessToken: token.value,
    documentNumber: raised.value,
  });
  if (!payments.ok) return payments;
  await recordFortnoxPayments({ context, invoice, payments: payments.value });
  const after = await loadInvoice({ context, id: invoice.id });
  return after ? ok({ value: after }) : notFound({ entity: "Invoice" });
}

export const syncInvoice = defineOperation({
  name: "invoice.sync",
  kind: "command",
  description:
    "Bring a SENT invoice raised in Fortnox up to date (ADR 0090): raise it there if sending " +
    "did not reach Fortnox, then read the payments booked on it. Bibi also does this by " +
    "itself when Fortnox reports a payment; use it to refresh now. CONFLICT for an invoice " +
    "that is not SENT or not raised in Fortnox.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  // May raise and email the invoice when sending did not reach Fortnox: the AI asks first.
  handler: async ({ input, context }) => {
    const invoice = await loadInvoice({ context, id: input.id });
    if (!invoice) return notFound({ entity: "Invoice" });
    if (invoice.status !== "SENT" || invoice.provider !== "FORTNOX") {
      return conflict({ message: "Only a SENT invoice raised in Fortnox can be synced" });
    }
    return ok({ value: invoice });
  },
  external: ({ output, context }) => syncWithFortnox({ context, invoice: output }),
});
