/** What `billOf` reads of a quote; quotes come oldest version first. */
export type BilledQuote = { quoteStatus: string; totalInclVatMinor: number };

/** What `billOf` reads of an invoice; credit notes are the ones that are not FAILED. */
export type BilledInvoice = {
  status: string;
  totalInclVatMinor: number;
  creditNotes: readonly { amountMinor: number }[];
};

export type BillOfInput = {
  quotes: readonly BilledQuote[];
  invoices: readonly BilledInvoice[];
};

/**
 * What one order bills, incl. VAT (ADR 0057): its SENT invoices less their credit notes once it
 * is invoiced (ADR 0100; deducted deposits stay billed, ADR 0090), else its ACCEPTED quote.
 */
export function billOf({ quotes, invoices }: BillOfInput) {
  const sent = invoices.filter((i) => i.status === "SENT");
  if (sent.length > 0) {
    const credited = ({ invoice }: { invoice: BilledInvoice }) =>
      invoice.creditNotes.reduce((s, c) => s + c.amountMinor, 0);
    const billedMinor = sent.reduce(
      (sum, i) => sum + i.totalInclVatMinor - credited({ invoice: i }),
      0,
    );
    return { billedFrom: "INVOICE" as const, billedMinor };
  }
  const accepted = quotes.findLast((q) => q.quoteStatus === "ACCEPTED");
  if (accepted) return { billedFrom: "QUOTE" as const, billedMinor: accepted.totalInclVatMinor };
  return { billedFrom: "NONE" as const, billedMinor: 0 };
}
