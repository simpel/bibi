import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { findProvider } from "../../providers/registry";
import { resolveRoute } from "../../providers/resolve-route";
import { conflict, notFound } from "../../shared/errors";
import { fillBuyerReference } from "./buyer-reference";
import { raisedInProvider } from "./invoice-provider";
import { moveInvoice } from "./move-invoice";
import { type InvoiceDto, InvoiceIdInputSchema, InvoiceSchema } from "./schema";
import { syncWithProvider } from "./sync-operation";
import { invoiceFlags, loadInvoice } from "./to-invoice-dto";
import { voidAtProvider } from "./void-at-provider";

export { moveInvoice };

export const sendInvoice = defineOperation({
  name: "invoice.send",
  kind: "command",
  description:
    "Mark a DRAFT invoice as SENT to the customer; it becomes what the order owes. It is " +
    "raised where the INVOICE route says (ADR 0090, 0100), through that provider's invoicing: " +
    "in an accounting system (created, booked and emailed there; payments are " +
    "mirrored back) or the payment operator's invoicing (emailed with a pay link, providerUrl). " +
    "With no INVOICE route it is kept in Bibi for payments requested with payment.create. Any " +
    "other starting status is a CONFLICT. An invoice without a buyer's reference takes the " +
    "order's current one; a customer that requires one is a VALIDATION error without it.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: async ({ input: { id }, context }) => {
    const route = await resolveRoute({ context, method: "INVOICE" });
    if (!route.ok) return route;
    const referenced = await fillBuyerReference({ context, invoiceId: id });
    if (!referenced.ok) return referenced;
    const sent = await moveInvoice({ context, id, to: "SENT" });
    if (!sent.ok || route.value === null || !route.value.adapter.invoicing) return sent;
    const { provider, connection } = route.value;
    await context.db.invoice.update({
      where: { id },
      data: { provider, connectionId: connection.id },
    });
    const invoice = { ...sent.value, provider };
    return ok({ value: { ...invoice, ...invoiceFlags({ invoice }) } });
  },
  // The provider only after the commit (ADR 0058); a failure leaves it SENT without a document
  // number, and invoice.sync raises it again.
  external: ({ output, context }) =>
    raisedInProvider({ invoice: output })
      ? syncWithProvider({ context, invoice: output })
      : Promise.resolve(ok({ value: output })),
});

type VoidCheckInput = { invoice: InvoiceDto };

/** A paid or booked invoice is credited, never voided (ADR 0100). */
function checkNotBooked({ invoice }: VoidCheckInput): Result<true> {
  const credit = "credit it instead (invoice.credit)";
  if (invoice.paidMinor !== 0) return conflict({ message: `It has been paid; ${credit}` });
  const ledger = invoice.provider ? findProvider({ key: invoice.provider })?.ledger : false;
  if (ledger && invoice.providerReference) {
    return conflict({ message: `It is booked in ${invoice.provider}; ${credit}` });
  }
  return ok({ value: true });
}

export const voidInvoice = defineOperation({
  name: "invoice.void",
  kind: "command",
  description:
    "Void a DRAFT or SENT invoice: it is no longer owed and the order can be invoiced again. An " +
    "invoice raised at a provider is voided there too: if the provider refuses, the invoice is " +
    "SENT again (the error says why); if it does not answer, the invoice stays VOID with " +
    "voidPending true and Bibi retries every 15 minutes. Refused (CONFLICT) while a payment " +
    "against it is PENDING, once anything is paid against it, or when it is booked in an " +
    "accounting system: credit it with invoice.credit instead.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: async ({ input: { id }, context }) => {
    const before = await loadInvoice({ context, id });
    if (!before) return notFound({ entity: "Invoice" });
    const allowed = checkNotBooked({ invoice: before });
    if (!allowed.ok) return allowed;
    return moveInvoice({ context, id, to: "VOID" });
  },
  external: ({ output, context }) => voidAtProvider({ context, invoice: output }),
});
