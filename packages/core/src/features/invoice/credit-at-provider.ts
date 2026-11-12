import { getLogger } from "@bibi/logger";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { isAmbiguous } from "../payment/refund-at-provider";
import { invoiceProviderCall } from "./invoice-provider";
import type { InvoiceDto } from "./schema";
import { loadInvoice } from "./to-invoice-dto";

export type CreditAtProviderInput = { context: OperationContext; invoice: InvoiceDto };

/**
 * Raises the invoice's PENDING credit notes at the provider the invoice lives in, after the commit
 * (ADR 0058): ISSUED with the provider's reference, or FAILED on a definite refusal (it then
 * credits nothing). An unanswered call keeps it PENDING (`invoice.creditUnconfirmed`): the money
 * may be credited there, and the credit retry reads it there before it sends anything again.
 */
export async function creditAtProvider({
  context,
  invoice,
}: CreditAtProviderInput): Promise<Result<InvoiceDto>> {
  const pending = await context.db.creditNote.findMany({
    where: { invoiceId: invoice.id, status: "PENDING" },
  });
  if (pending.length > 0) {
    const row = await context.db.invoice.findFirst({ where: { id: invoice.id } });
    if (!row?.providerReference) return notFound({ entity: "Invoice" });
    const call = await invoiceProviderCall({ context, invoice: row });
    for (const note of pending) {
      const credited = call.ok
        ? await call.value.invoicing.credit({
            auth: call.value.auth,
            providerReference: row.providerReference,
            amountMinor: note.amountMinor,
            reason: note.reason,
            idempotencyKey: `bibi-credit-${note.id}`,
          })
        : call;
      if (!credited.ok) {
        if (isAmbiguous({ error: credited.error })) {
          getLogger().warn({ event: "invoice.creditUnconfirmed", creditNoteId: note.id });
          return err({ error: credited.error });
        }
        await context.db.creditNote.update({ where: { id: note.id }, data: { status: "FAILED" } });
        return err({ error: credited.error });
      }
      await context.db.creditNote.update({
        where: { id: note.id },
        data: {
          status: "ISSUED",
          issuedAt: nowOf({ context }),
          providerReference: credited.value.providerReference,
          providerUrl: credited.value.url,
        },
      });
    }
  }
  const after = await loadInvoice({ context, id: invoice.id });
  return after ? ok({ value: after }) : notFound({ entity: "Invoice" });
}
