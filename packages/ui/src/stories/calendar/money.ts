import type { Money } from "./calendar-types";

/** "SEK 10,800": whole units, the currency's code first. The app formats in the user's locale. */
export function formatMoney({ money, locale = "en-GB" }: { money: Money; locale?: string }) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(money.amount);
}
