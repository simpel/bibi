import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { DEFAULT_INVOICE_DAYS } from "../payment/request-charge";
import { checkPricedLines } from "../quote/check-priced-lines";
import { deriveTicketLines } from "../quote/derive-lines";
import { writeOrderLines } from "../quote/freeze-lines";
import { quoteTotals } from "../quote/line-totals";
import { checkReadable } from "../ticket/ticket-rules";
import { type InvoiceCreateInput, InvoiceCreateInputSchema, InvoiceSchema } from "./schema";
import { loadInvoice } from "./to-invoice-dto";

type Context = Pick<OperationContext, "db" | "permissions">;

type InvoiceableInput = { context: Context; input: InvoiceCreateInput };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * An invoice needs a ticket in an `invoiceable` phase without another invoice that is not VOID
 * (the partial unique index refuses a concurrent second one); its due date follows the
 * customer's payment terms unless given.
 */
async function checkInvoiceable({ context, input }: InvoiceableInput): Promise<Result<Date>> {
  const ticket = await context.db.ticket.findFirst({
    where: { id: input.ticketId },
    include: { phase: { select: { name: true, invoiceable: true } }, customer: true },
  });
  if (!ticket) return notFound({ entity: "Ticket" });
  if (!ticket.phase.invoiceable) {
    return conflict({ message: `A ticket in "${ticket.phase.name}" cannot be invoiced yet` });
  }
  const open = await context.db.invoice.count({
    where: { ticketId: input.ticketId, status: { not: "VOID" } },
  });
  if (open > 0) return conflict({ message: "The ticket already has an invoice; void it first" });
  const days = ticket.customer.paymentTermsDays ?? DEFAULT_INVOICE_DAYS;
  return ok({ value: input.dueDate ?? new Date(Date.now() + days * DAY_MS) });
}

export const createInvoice = defineOperation({
  name: "invoice.create",
  kind: "command",
  description:
    "Invoice a ticket (ADR 0052, 0057): freezes its priced lines as the invoice's snapshot " +
    "with totals and the organization's next invoice number, as a DRAFT. The ticket's phase " +
    "must be invoiceable and the ticket must have no other invoice that is not VOID. Each " +
    "line needs a quantity and VAT. Send it (invoice.send) before requesting payment " +
    "(payment.create with invoiceId).",
  input: InvoiceCreateInputSchema,
  output: InvoiceSchema,
  permission: "payment:write",
  handler: async ({ input, context }) => {
    // The snapshot copies the ticket's lines, so the caller must be able to read them.
    const readable = checkReadable({ context, permission: "line:read", path: "ticketId" });
    if (!readable.ok) return readable;
    const dueDate = await checkInvoiceable({ context, input });
    if (!dueDate.ok) return dueDate;
    const derived =
      (await deriveTicketLines({ context, ticketIds: [input.ticketId] })).get(input.ticketId) ?? [];
    const priced = checkPricedLines({ lines: derived, what: "An invoice" });
    if (!priced.ok) return priced;
    const lines = derived.map((d) => d.line);
    const top = await context.db.invoice.aggregate({ _max: { number: true } });
    const row = await context.db.invoice.create({
      data: {
        organizationId: context.organizationId,
        ticketId: input.ticketId,
        number: (top._max.number ?? 0) + 1,
        dueDate: dueDate.value,
        ...quoteTotals({ lines }),
        createdBy: context.actor.userId,
      },
    });
    await writeOrderLines({ context, owner: { invoiceId: row.id }, lines });
    const invoice = await loadInvoice({ context, id: row.id });
    if (!invoice) return notFound({ entity: "Invoice" });
    context.recordChange({ entityId: row.id, after: invoice });
    return ok({ value: invoice });
  },
});
