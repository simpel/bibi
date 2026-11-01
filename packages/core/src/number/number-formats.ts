/** How a user wants numbers written (#482): digit-group and decimal separators. */
export const NUMBER_FORMATS = ["SPACE_COMMA", "COMMA_DOT", "DOT_COMMA", "SPACE_DOT"] as const;

/**
 * How a user wants amounts written, its own setting apart from `NUMBER_FORMATS`: the name reads
 * in screen order. `CODE_COMMA` = SEK 1,012,990.00, `COMMA_SYMBOL` = 1,012,990.00 kr,
 * `SPACE_SYMBOL` = 1 012 990,00 kr, `SPACE_CODE` = 1 012 990,00 SEK.
 */
export const MONEY_FORMATS = ["CODE_COMMA", "COMMA_SYMBOL", "SPACE_SYMBOL", "SPACE_CODE"] as const;

export type NumberFormatStyle = (typeof NUMBER_FORMATS)[number];
export type MoneyFormat = (typeof MONEY_FORMATS)[number];

/** A no-break space, so `1 234` never wraps between its digit groups. */
export const SPACE = " ";

/** The group and decimal separator of each style. */
export const SEPARATORS: Readonly<Record<NumberFormatStyle, { group: string; decimal: string }>> = {
  SPACE_COMMA: { group: SPACE, decimal: "," },
  COMMA_DOT: { group: ",", decimal: "." },
  DOT_COMMA: { group: ".", decimal: "," },
  SPACE_DOT: { group: SPACE, decimal: "." },
};

/**
 * The currency of an amount that does not carry one (item prices, quote totals, budgets). Bibi
 * has one currency per organization until a setting for it exists; payments and receivables
 * store their own `currency`.
 */
export const DEFAULT_CURRENCY = "SEK";

/** What a user without a money format sees: `1 012 990,00 kr`. */
export const DEFAULT_MONEY_FORMAT: MoneyFormat = "SPACE_SYMBOL";

/** The separators, currency text and currency place of each money format. */
export const MONEY_STYLES: Readonly<
  Record<
    MoneyFormat,
    { style: NumberFormatStyle; currency: "code" | "narrowSymbol"; place: "before" | "after" }
  >
> = {
  CODE_COMMA: { style: "COMMA_DOT", currency: "code", place: "before" },
  COMMA_SYMBOL: { style: "COMMA_DOT", currency: "narrowSymbol", place: "after" },
  SPACE_SYMBOL: { style: "SPACE_COMMA", currency: "narrowSymbol", place: "after" },
  SPACE_CODE: { style: "SPACE_COMMA", currency: "code", place: "after" },
};
