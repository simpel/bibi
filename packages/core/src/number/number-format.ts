import { type MoneyFlow, moneyFlowOf } from "./money-flow";
import {
  type CurrencyDisplay,
  DEFAULT_CURRENCY,
  type NumberFormatStyle,
  SEPARATORS,
} from "./number-formats";

/** A user's number choices; `null` = the UI language's style, with a currency symbol. */
export type NumberFormats = {
  numberFormat: NumberFormatStyle | null;
  currencyDisplay: CurrencyDisplay | null;
};

export type CreateNumberFormatInput = { locale: string; formats: NumberFormats };

type NumberInput = {
  value: number;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};
type MoneyInput = { minor: number; currency?: string | null };

/** Every way the UI writes a number or an amount (#482): one object per locale and user. */
export type NumberFormat = {
  /** `1 234,5`; at most two decimals unless told otherwise. */
  number: (input: NumberInput) => string;
  /** Minor units with their currency, always two decimals: `1 234,50 kr`, `SEK 1,234.50`. */
  money: (input: MoneyInput) => string;
  /** Minor units without a currency, always two decimals: `1 234,50`. */
  amount: (input: Omit<MoneyInput, "currency">) => string;
  /** Settings for an animated amount (NumberFlow) that reads as `money` does. */
  moneyFlow: (input: Pick<MoneyInput, "currency">) => MoneyFlow;
};

type PartsInput = {
  locale: string;
  style: NumberFormatStyle | null;
  options: Intl.NumberFormatOptions;
};

/** Formats with the locale's rules, then swaps in the user's separators. */
function formatter({ locale, style, options }: PartsInput) {
  const intl = new Intl.NumberFormat(locale, options);
  if (!style) return (value: number) => intl.format(value);
  const { group, decimal } = SEPARATORS[style];
  return (value: number) =>
    intl
      .formatToParts(value)
      .map((part) =>
        part.type === "group" ? group : part.type === "decimal" ? decimal : part.value,
      )
      .join("");
}

const TWO = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

/** The formatter for one user: their separators and currency display, the locale's elsewhere. */
export function createNumberFormat({ locale, formats }: CreateNumberFormatInput): NumberFormat {
  const style = formats.numberFormat;
  const currencyDisplay = formats.currencyDisplay === "CODE" ? "code" : "symbol";
  return {
    number: ({ value, maximumFractionDigits = 2, minimumFractionDigits = 0 }) =>
      formatter({ locale, style, options: { maximumFractionDigits, minimumFractionDigits } })(
        value,
      ),
    money: ({ minor, currency }) =>
      formatter({
        locale,
        style,
        options: {
          style: "currency",
          currency: currency ?? DEFAULT_CURRENCY,
          currencyDisplay,
          ...TWO,
        },
      })(minor / 100),
    amount: ({ minor }) => formatter({ locale, style, options: TWO })(minor / 100),
    moneyFlow: ({ currency }) =>
      moneyFlowOf({ locale, style, currency: currency ?? DEFAULT_CURRENCY, currencyDisplay }),
  };
}
