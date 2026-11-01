import type { NumberFormatStyle } from "./number-formats";

/**
 * A locale whose own separators are each style's, for components that format with `Intl`
 * themselves and cannot swap separators afterwards (an animated number). All four group from
 * four digits, like the formatter.
 */
const STYLE_LOCALES: Readonly<Record<NumberFormatStyle, string>> = {
  SPACE_COMMA: "sv-SE",
  COMMA_DOT: "en-US",
  DOT_COMMA: "de-DE",
  SPACE_DOT: "xh-ZA",
};

/** How an animated number writes an amount so it reads exactly as `money` does. */
export type MoneyFlow = {
  locales: string;
  /** Two decimals, like `money`. */
  format: { minimumFractionDigits: number; maximumFractionDigits: number };
  /** The currency and its spacing, where the money format puts it: `SEK ` or ` kr`. */
  prefix: string;
  suffix: string;
};

export type MoneyFlowInput = { style: NumberFormatStyle; prefix: string; suffix: string };

/** Digits in the money format's separators, with its currency text around them. */
export function moneyFlowOf({ style, prefix, suffix }: MoneyFlowInput): MoneyFlow {
  return {
    locales: STYLE_LOCALES[style],
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    prefix,
    suffix,
  };
}
