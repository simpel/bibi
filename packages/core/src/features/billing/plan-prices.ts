import { getLogger } from "@bibi/logger";
import type { PlanPrices } from "./gateway";
import { getBillingGateway } from "./gateway-registry";
import { BILLING_PLAN } from "./plan";

/** The published price (ADR 0095) as the public page writes it. Minor units, excl. VAT. */
export type PlanPriceFacts = {
  currency: string;
  baseMonthlyMinor: number;
  baseYearlyMinor: number;
  seatMonthlyMinor: number;
  /** Off the monthly price when paying yearly, in whole percent. */
  yearlyDiscountPercent: number;
  includedSeats: number;
  trialDays: number;
};

/** Prices change rarely; a change in Stripe reaches the page within this time. */
const TTL_MS = 60 * 60 * 1000;
/** After a failed read, try Stripe again sooner. */
const FAILED_TTL_MS = 5 * 60 * 1000;

let cached: { facts: Promise<PlanPriceFacts | null>; expires: number } | null = null;

type FactsInput = {
  currency: string;
  baseMonthlyMinor: number;
  baseYearlyMinor: number;
  seatMonthlyMinor: number;
};

function toFacts({ currency, baseMonthlyMinor, baseYearlyMinor, seatMonthlyMinor }: FactsInput) {
  const yearlyDiscountPercent = Math.round(100 * (1 - baseYearlyMinor / (12 * baseMonthlyMinor)));
  return {
    ...{ currency, baseMonthlyMinor, baseYearlyMinor, seatMonthlyMinor, yearlyDiscountPercent },
    includedSeats: BILLING_PLAN.includedSeats,
    trialDays: BILLING_PLAN.trialDays,
  };
}

/** The plan as typed into `BILLING_PLAN`: what the page shows while Stripe is not configured. */
export function defaultPlanPrices(): PlanPriceFacts {
  return toFacts({
    currency: BILLING_PLAN.currency,
    baseMonthlyMinor: BILLING_PLAN.baseMonthlyMinor,
    baseYearlyMinor: BILLING_PLAN.baseYearlyMinor,
    seatMonthlyMinor: BILLING_PLAN.seatMonthlyMinor,
  });
}

/** Facts only from prices that read as the plan: monthly, yearly and monthly, one currency. */
function factsFrom({ prices }: { prices: PlanPrices }): PlanPriceFacts | null {
  const { baseMonthly, baseYearly, seat } = prices;
  const fits =
    baseMonthly.interval === "MONTH" &&
    baseYearly.interval === "YEAR" &&
    seat.interval === "MONTH" &&
    baseMonthly.amountMinor > 0 &&
    baseYearly.currency === baseMonthly.currency &&
    seat.currency === baseMonthly.currency;
  if (!fits) return null;
  return toFacts({
    currency: baseMonthly.currency,
    baseMonthlyMinor: baseMonthly.amountMinor,
    baseYearlyMinor: baseYearly.amountMinor,
    seatMonthlyMinor: seat.amountMinor,
  });
}

async function readFacts(): Promise<{ facts: PlanPriceFacts | null; failed: boolean }> {
  try {
    const prices = await getBillingGateway().getPrices();
    if (!prices.ok) {
      getLogger().warn({ event: "billing.pricesReadFailed", err: prices.error });
      return { facts: null, failed: true };
    }
    if (!prices.value) return { facts: null, failed: false };
    const facts = factsFrom({ prices: prices.value });
    if (!facts) getLogger().warn({ event: "billing.pricesUnfit" });
    return { facts, failed: false };
  } catch (error) {
    getLogger().warn({ event: "billing.pricesReadFailed", err: error });
    return { facts: null, failed: true };
  }
}

/**
 * Bibi's published price as Stripe holds it, for the public page (no organization, no user).
 * Null while billing is not configured or Stripe cannot be read: the page then shows
 * `defaultPlanPrices()`. Cached in this process for an hour; never throws.
 */
export function loadPlanPrices(): Promise<PlanPriceFacts | null> {
  if (cached && cached.expires > Date.now()) return cached.facts;
  const entry = {
    facts: Promise.resolve<PlanPriceFacts | null>(null),
    expires: Date.now() + TTL_MS,
  };
  entry.facts = readFacts().then(({ facts, failed }) => {
    if (failed) entry.expires = Date.now() + FAILED_TTL_MS;
    return facts;
  });
  cached = entry;
  return entry.facts;
}

/** Drops the cached prices in this process (after an admin change, and in tests). */
export function clearPlanPricesCache(): void {
  cached = null;
}
