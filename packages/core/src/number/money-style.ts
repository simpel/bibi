import { DEFAULT_MONEY_FORMAT, MONEY_STYLES, type MoneyFormat, SPACE } from "./number-formats";

export type CurrencyTextInput = {
  locale: string;
  currency: string;
  moneyFormat: MoneyFormat | null;
};

/** `kr`, `€` or `SEK`, `EUR` as the user's money format names the currency. */
export function currencyText({ locale, currency, moneyFormat }: CurrencyTextInput): string {
  const { currency: display } = MONEY_STYLES[moneyFormat ?? DEFAULT_MONEY_FORMAT];
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: display,
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

export type CurrencyAffixInput = CurrencyTextInput;

/** The text around an amount's digits: `SEK ` before, or ` kr` after, with a no-break space. */
export function currencyAffix({ locale, currency, moneyFormat }: CurrencyAffixInput): {
  prefix: string;
  suffix: string;
} {
  const text = currencyText({ locale, currency, moneyFormat });
  return MONEY_STYLES[moneyFormat ?? DEFAULT_MONEY_FORMAT].place === "before"
    ? { prefix: `${text}${SPACE}`, suffix: "" }
    : { prefix: "", suffix: `${SPACE}${text}` };
}
