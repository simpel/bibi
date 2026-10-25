/** How a user wants numbers written (#482): digit-group and decimal separators. */
export const NUMBER_FORMATS = ["SPACE_COMMA", "COMMA_DOT", "DOT_COMMA", "SPACE_DOT"] as const;

/** How an amount names its currency (#482): `kr`, `€` or `SEK`, `EUR`. */
export const CURRENCY_DISPLAYS = ["SYMBOL", "CODE"] as const;

export type NumberFormatStyle = (typeof NUMBER_FORMATS)[number];
export type CurrencyDisplay = (typeof CURRENCY_DISPLAYS)[number];

/** A no-break space, so `1 234` never wraps between its digit groups. */
const SPACE = " ";

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
