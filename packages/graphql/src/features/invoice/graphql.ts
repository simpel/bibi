import {
  createInvoice,
  getInvoice,
  type InvoiceDto,
  InvoiceSchema,
  listInvoices,
  type OrderLineDto,
  OrderLineSchema,
  sendInvoice,
  voidInvoice,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { type Page, pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { TicketRef } from "../ticket/graphql";

const InvoiceLineRef = objectFromSchema<OrderLineDto>({
  name: "InvoiceLine",
  schema: OrderLineSchema,
  description: "An order line on an invoice: one ticket line's price, frozen at invoicing.",
});

export const InvoiceRef = objectFromSchema<InvoiceDto>({
  name: "Invoice",
  schema: InvoiceSchema,
  omit: ["organizationId", "lines"],
  description:
    "An invoice (ADR 0052, 0057): a frozen snapshot of the ticket's priced lines with totals. " +
    "Lifecycle DRAFT → SENT → VOID; what is paid against it is derived from its payments.",
});
const InvoicePageRef = pageType({ name: "InvoicePage", item: InvoiceRef });

builder.objectField(InvoiceRef, "lines", (t) =>
  t.field({
    type: [InvoiceLineRef],
    description: InvoiceSchema.shape.lines.description,
    resolve: (invoice) => invoice.lines,
  }),
);

fieldFromOperation({ operation: listInvoices, type: InvoicePageRef, name: "invoices" });
fieldFromOperation({ operation: getInvoice, type: InvoiceRef, name: "invoice" });
for (const operation of [createInvoice, sendInvoice, voidInvoice]) {
  mutationFromOperation({ operation, type: InvoiceRef });
}

// Graph edge. Goes through `invoice.list`, so its permission applies here too.
builder.objectField(TicketRef, "invoices", (t) =>
  t.field({
    type: [InvoiceRef],
    description: "Invoices of the ticket, newest first.",
    resolve: async (ticket, _args, ctx) => {
      const input = { ticketId: ticket.id, limit: 100 };
      const page = (await runOperation({
        operation: listInvoices,
        input,
        ctx,
      })) as Page<InvoiceDto>;
      return page.items;
    },
  }),
);
