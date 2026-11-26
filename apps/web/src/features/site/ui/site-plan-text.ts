import "server-only";
import { defaultPlanPrices, loadPlanPrices } from "@bibi/core";
import type { NumberFormat } from "@bibi/core/schemas";
import { cache } from "react";
import { wholeMoney } from "@/lib/number/whole-money";
import { getNumberFormat } from "@/server/number-format";

/** The published price's figures, written for the `site` texts' placeholders. */
export type SitePlanText = {
  amount: string;
  seatAmount: string;
  discount: string;
  seats: string;
  trialDays: string;
  /** False when Stripe's yearly price gives no discount: the fact is left out. */
  hasYearlyDiscount: boolean;
};

type MoneyTextInput = { numbers: NumberFormat; minor: number; currency: string };

/** Whole units when the price has no öre (`9 990 kr`), else to the öre. */
const moneyText = ({ numbers, minor, currency }: MoneyTextInput) =>
  minor % 100 === 0 ? wholeMoney({ numbers, minor, currency }) : numbers.money({ minor, currency });

/**
 * The price as Stripe holds it (cached an hour in core), or the typed plan while Stripe is not
 * configured or cannot be read, so the page never shows an empty price.
 */
export const getSitePlanText = cache(async (): Promise<SitePlanText> => {
  const [prices, numbers] = await Promise.all([loadPlanPrices(), getNumberFormat()]);
  const plan = prices ?? defaultPlanPrices();
  const currency = plan.currency.toUpperCase();
  return {
    amount: moneyText({ numbers, minor: plan.baseMonthlyMinor, currency }),
    seatAmount: moneyText({ numbers, minor: plan.seatMonthlyMinor, currency }),
    discount: numbers.number({ value: plan.yearlyDiscountPercent, maximumFractionDigits: 0 }),
    seats: numbers.number({ value: plan.includedSeats }),
    trialDays: numbers.number({ value: plan.trialDays }),
    hasYearlyDiscount: plan.yearlyDiscountPercent > 0,
  };
});
