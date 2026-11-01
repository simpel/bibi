import type { AccountingEvent, Settles } from "./events";

/** Voucher text: what happened, the invoice number and the ticket reference, never a name. */
export function voucherText({ event }: { event: AccountingEvent }): string {
  const ticket = `ticket ${event.ticketReference}`;
  const settled = ({ settles }: { settles: Settles }) =>
    settles.kind === "INVOICE"
      ? `invoice ${settles.invoiceNumber}`
      : settles.kind === "DEPOSIT"
        ? "deposit"
        : "quote";
  switch (event.kind) {
    case "INVOICE_SENT":
      return `Invoice ${event.invoiceNumber}, ${ticket}`;
    case "INVOICE_VOID":
      return `Void invoice ${event.invoiceNumber}, ${ticket}`;
    case "PAYMENT":
      return `Payment ${settled({ settles: event.settles })}, ${ticket}`;
    case "REFUND":
      return `Refund ${settled({ settles: event.settles })}, ${ticket}`;
    case "FEE":
      return `Payment fee, ${ticket}`;
  }
}
