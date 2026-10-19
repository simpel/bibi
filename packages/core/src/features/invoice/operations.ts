import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { createInvoice } from "./create-operation";
import { sendInvoice, voidInvoice } from "./lifecycle-operations";
import {
  InvoiceIdInputSchema,
  InvoiceListInputSchema,
  InvoiceListOutputSchema,
  InvoiceSchema,
} from "./schema";
import { INVOICE_INCLUDE, loadInvoice, toInvoiceDtos } from "./to-invoice-dto";

export const listInvoices = defineOperation({
  name: "invoice.list",
  kind: "query",
  description:
    "Invoices of a ticket, newest first: number, frozen lines and totals, due date, status " +
    "(DRAFT, SENT, VOID) and what is paid against each (paidMinor, openMinor, progress).",
  input: InvoiceListInputSchema,
  output: InvoiceListOutputSchema,
  permission: "payment:read",
  handler: async ({ input: { ticketId, limit, cursor }, context }) => {
    const rows = await context.db.invoice.findMany({
      where: { ticketId },
      include: INVOICE_INCLUDE,
      orderBy: [{ number: "desc" }, { id: "desc" }],
      ...pageArgs({ limit, cursor }),
    });
    const page = paginate({ rows, limit });
    const items = await toInvoiceDtos({ context, rows: page.items });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getInvoice = defineOperation({
  name: "invoice.get",
  kind: "query",
  description: "Get one invoice by id with its frozen lines, status and what is paid against it.",
  input: InvoiceIdInputSchema,
  output: InvoiceSchema,
  permission: "payment:read",
  handler: async ({ input, context }) => {
    const invoice = await loadInvoice({ context, id: input.id });
    return invoice ? ok({ value: invoice }) : notFound({ entity: "Invoice" });
  },
});

export { createInvoice, sendInvoice, voidInvoice };

/** Invoices: frozen snapshots of the ticket's lines that payments settle (ADR 0052, 0057). */
export const invoiceOperations = [
  listInvoices,
  getInvoice,
  createInvoice,
  sendInvoice,
  voidInvoice,
];
