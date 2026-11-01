import type { AccountMap, RevenuePart } from "./accounts";

/** What a payment or refund settled (ADR 0057): an invoice, a deposit, or a quote paid by card. */
export type Settles =
  | { kind: "INVOICE"; invoiceNumber: number }
  | { kind: "DEPOSIT" }
  | { kind: "QUOTE"; parts: readonly RevenuePart[] };

type Base = { date: string; ticketReference: number };

/** An invoice sent, or voided after it was exported (a reversal). */
export type InvoiceEvent = Base & {
  kind: "INVOICE_SENT" | "INVOICE_VOID";
  invoiceNumber: number;
  totalInclVatMinor: number;
  parts: readonly RevenuePart[];
  /** Paid deposits on the ticket, moved from customer advances to receivables. */
  depositOffsetMinor: number;
};

/** Money received, or refunded, against one receivable. */
export type CashEvent = Base & {
  kind: "PAYMENT" | "REFUND";
  amountMinor: number;
  settles: Settles;
};

/** The payment provider's application fee on a payment. */
export type FeeEvent = Base & { kind: "FEE"; amountMinor: number };

/** The facts a voucher is derived from, one per event (ADR 0077 decision 5). */
export type AccountingEvent = InvoiceEvent | CashEvent | FeeEvent;

/** VAT rates the events use that have no output VAT account: the export is refused until set. */
export function missingVatRates({
  accounts,
  events,
}: {
  accounts: AccountMap;
  events: readonly AccountingEvent[];
}): number[] {
  const rates = new Set<number>();
  for (const event of events) {
    const parts =
      "parts" in event
        ? event.parts
        : "settles" in event && event.settles.kind === "QUOTE"
          ? event.settles.parts
          : [];
    for (const part of parts) if (part.vatMinor !== 0) rates.add(part.vatRatePercent);
  }
  return [...rates].filter((rate) => !accounts.vatOutput[rate]).sort((a, b) => a - b);
}
