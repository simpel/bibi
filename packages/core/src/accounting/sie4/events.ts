import type { AccountMap, RevenuePart, VatPart } from "./accounts";

/**
 * A deposit's VAT split (ADR 0093): the snapshot on the deposit, empty when it carries no VAT.
 * A payment or a deduction scales it to its own amount.
 */
export type DepositVat = { parts: readonly VatPart[] };

/** What a payment or refund settled (ADR 0057): an invoice, a deposit, or a quote paid by card. */
export type Settles =
  | { kind: "INVOICE"; invoiceNumber: number }
  | ({ kind: "DEPOSIT" } & DepositVat)
  | { kind: "QUOTE"; parts: readonly RevenuePart[] };

type Base = { date: string; orderReference: number };

/** An invoice sent, or voided after it was exported (a reversal). */
export type InvoiceEvent = Base & {
  kind: "INVOICE_SENT" | "INVOICE_VOID";
  invoiceNumber: number;
  totalInclVatMinor: number;
  parts: readonly RevenuePart[];
  /** Paid deposits the invoice deducts: their advance and VAT reversed against receivables. */
  deductions: readonly (DepositVat & { amountMinor: number })[];
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

/** Every VAT part an event posts: its sale, a settled quote or deposit, its deductions. */
function partsOf({ event }: { event: AccountingEvent }): readonly VatPart[] {
  if ("parts" in event) return [...event.parts, ...event.deductions.flatMap((d) => d.parts)];
  if ("settles" in event && event.settles.kind !== "INVOICE") return event.settles.parts;
  return [];
}

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
    for (const part of partsOf({ event })) if (part.vatMinor !== 0) rates.add(part.vatRatePercent);
  }
  return [...rates].filter((rate) => !accounts.vatOutput[rate]).sort((a, b) => a - b);
}
