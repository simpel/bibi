import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BILLING_PLAN,
  clearPlanPricesCache,
  defaultPlanPrices,
  loadPlanPrices,
} from "../src/index";
import { useMemoryBilling } from "./billing-helpers";

const month = ({ amountMinor }: { amountMinor: number }) => ({
  amountMinor,
  currency: "sek",
  interval: "MONTH" as const,
});

describe("loadPlanPrices", () => {
  const billing = useMemoryBilling();
  beforeEach(() => clearPlanPricesCache());
  afterEach(() => clearPlanPricesCache());

  it("reads Stripe's prices and derives the yearly discount, seats and trial", async () => {
    billing.gateway().prices = {
      baseMonthly: month({ amountMinor: 1_200_000 }),
      baseYearly: { amountMinor: 12_240_000, currency: "sek", interval: "YEAR" },
      seat: month({ amountMinor: 5_900 }),
    };
    expect(await loadPlanPrices()).toEqual({
      currency: "sek",
      baseMonthlyMinor: 1_200_000,
      baseYearlyMinor: 12_240_000,
      seatMonthlyMinor: 5_900,
      yearlyDiscountPercent: 15,
      includedSeats: BILLING_PLAN.includedSeats,
      trialDays: BILLING_PLAN.trialDays,
    });
  });

  it("matches the typed plan with the plan's own prices", async () => {
    expect(await loadPlanPrices()).toEqual(defaultPlanPrices());
    expect(defaultPlanPrices().yearlyDiscountPercent).toBe(10);
  });

  it("caches the prices until the cache is cleared", async () => {
    const first = await loadPlanPrices();
    billing.gateway().prices = null;
    expect(await loadPlanPrices()).toEqual(first);
    clearPlanPricesCache();
    expect(await loadPlanPrices()).toBeNull();
  });

  it("is null while billing is not configured", async () => {
    billing.gateway().prices = null;
    expect(await loadPlanPrices()).toBeNull();
  });

  it("is null when a price does not read as the plan", async () => {
    const prices = billing.gateway().prices;
    if (!prices) throw new Error("memory gateway has prices");
    billing.gateway().prices = { ...prices, baseYearly: month({ amountMinor: 100 }) };
    expect(await loadPlanPrices()).toBeNull();
  });

  it("is null when Stripe fails, and never throws", async () => {
    billing.gateway().getPrices = async () => {
      throw new Error("network down");
    };
    expect(await loadPlanPrices()).toBeNull();
  });
});
