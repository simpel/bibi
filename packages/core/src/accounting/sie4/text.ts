import type { AccountingEvent, Settles } from "./events";

/** Voucher text: what happened, the invoice number and the order reference, never a name. */
export function voucherText({ event }: { event: AccountingEvent }): string {
  const order = `order ${event.orderReference}`;
  const settled = ({ settles }: { settles: Settles }) =>
    settles.kind === "INVOICE"
      ? `invoice ${settles.invoiceNumber}`
      : settles.kind === "DEPOSIT"
        ? "deposit"
        : "quote";
  switch (event.kind) {
    case "INVOICE_SENT":
      return `Invoice ${event.invoiceNumber}, ${order}`;
    case "INVOICE_VOID":
      return `Void invoice ${event.invoiceNumber}, ${order}`;
    case "PAYMENT":
      return `Payment ${settled({ settles: event.settles })}, ${order}`;
    case "REFUND":
      return `Refund ${settled({ settles: event.settles })}, ${order}`;
    case "FEE":
      return `Payment fee, ${order}`;
  }
}
