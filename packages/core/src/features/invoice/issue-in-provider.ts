import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { invoiceProviderCall } from "./invoice-provider";
import { loadForProvider, toInvoiceSnapshot } from "./invoice-snapshot";

export type IssueInProviderInput = { context: OperationContext; invoiceId: string };

/**
 * Raises a SENT invoice in the provider its INVOICE route chose (ADR 0090, 0100) through the
 * invoicing port, then stores the provider's reference and page. Runs only in an `external` step
 * (ADR 0058); an invoice already raised returns its reference.
 */
export async function issueInProvider({
  context,
  invoiceId,
}: IssueInProviderInput): Promise<Result<string>> {
  const invoice = await loadForProvider({ context, invoiceId });
  if (!invoice) return notFound({ entity: "Invoice" });
  if (invoice.providerReference) return ok({ value: invoice.providerReference });
  const call = await invoiceProviderCall({ context, invoice });
  if (!call.ok) return call;
  const snapshot = await toInvoiceSnapshot({ context, invoice });
  const issued = await call.value.invoicing.issue({ auth: call.value.auth, invoice: snapshot });
  if (!issued.ok) return issued;
  await context.db.invoice.update({
    where: { id: invoiceId },
    data: { providerReference: issued.value.providerReference, providerUrl: issued.value.url },
  });
  return ok({ value: issued.value.providerReference });
}
