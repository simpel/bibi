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
  /** The currency and its spacing, where the UI language puts it: `SEK ` or ` kr`. */
  prefix: string;
  suffix: string;
};

export type MoneyFlowInput = {
  locale: string;
  style: NumberFormatStyle | null;
  currency: string;
  currencyDisplay: "code" | "symbol";
};

/** Digits in the user's separators, currency text and place from the UI language. */
export function moneyFlowOf({
  locale,
  style,
  currency,
  currencyDisplay,
}: MoneyFlowInput): MoneyFlow {
  const digits = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay,
    ...digits,
  }).formatToParts(1);
  const number = new Set(["integer", "group", "decimal", "fraction"]);
  const first = parts.findIndex((part) => number.has(part.type));
  const last = parts.findLastIndex((part) => number.has(part.type));
  const text = ({ list }: { list: Intl.NumberFormatPart[] }) =>
    list.map((part) => part.value).join("");
  return {
    locales: style ? STYLE_LOCALES[style] : locale,
    format: digits,
    prefix: text({ list: parts.slice(0, first) }),
    suffix: text({ list: parts.slice(last + 1) }),
  };
}
