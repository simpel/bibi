/**
 * The accounts a voucher posts to (ADR 0077). Resolved from `AccountingSettings` before the
 * vouchers are built, so the builder is pure. Account numbers are strings (BAS: four digits).
 */
export type AccountMap = {
  /** Customer receivables (BAS 1510). */
  receivable: string;
  /** Payments on their way from the payment provider (BAS 1580). */
  clearing: string;
  /** Customer advances: paid deposits (BAS 2420). */
  advances: string;
  /** The payment provider's fees (BAS 6570). */
  fees: string;
  /** Rounding differences (BAS 3740). */
  rounding: string;
  /** Output VAT per rate in percent, e.g. 25 → 2611. */
  vatOutput: Readonly<Record<number, string>>;
};

/** One revenue component of a sale: its revenue account, VAT rate and amount excluding VAT. */
export type RevenuePart = {
  account: string;
  vatRatePercent: number;
  exclVatMinor: number;
  vatMinor: number;
};
