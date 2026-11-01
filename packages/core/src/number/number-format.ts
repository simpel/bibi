import { type MoneyFlow, moneyFlowOf } from "./money-flow";
import { currencyAffix } from "./money-style";
import {
  DEFAULT_CURRENCY,
  DEFAULT_MONEY_FORMAT,
  MONEY_STYLES,
  type MoneyFormat,
  type NumberFormatStyle,
  SEPARATORS,
} from "./number-formats";

/** A user's number choices; `null` = the UI language's style, and `SPACE_SYMBOL` for money. */
export type NumberFormats = {
  numberFormat: NumberFormatStyle | null;
  moneyFormat: MoneyFormat | null;
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
  /** Minor units in the money format, always two decimals: `1 234,50 kr`, `SEK 1,234.50`. */
  money: (input: MoneyInput) => string;
  /** Minor units in the money format's separators, no currency, two decimals: `1 234,50`. */
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

/** The formatter for one user: their number and money formats, the locale's elsewhere. */
export function createNumberFormat({ locale, formats }: CreateNumberFormatInput): NumberFormat {
  const style = formats.numberFormat;
  const { moneyFormat } = formats;
  const amount = formatter({
    locale,
    style: MONEY_STYLES[moneyFormat ?? DEFAULT_MONEY_FORMAT].style,
    options: TWO,
  });
  const affix = ({ currency }: Pick<MoneyInput, "currency">) =>
    currencyAffix({ locale, currency: currency ?? DEFAULT_CURRENCY, moneyFormat });
  return {
    number: ({ value, maximumFractionDigits = 2, minimumFractionDigits = 0 }) =>
      formatter({ locale, style, options: { maximumFractionDigits, minimumFractionDigits } })(
        value,
      ),
    money: ({ minor, currency }) => {
      const { prefix, suffix } = affix({ currency });
      return `${prefix}${amount(minor / 100)}${suffix}`;
    },
    amount: ({ minor }) => amount(minor / 100),
    moneyFlow: ({ currency }) =>
      moneyFlowOf({
        style: MONEY_STYLES[moneyFormat ?? DEFAULT_MONEY_FORMAT].style,
        ...affix({ currency }),
      }),
  };
}
