import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { createPlatformContext, createPlatformOperations, executePlatform } from "../src/index";
import { unwrap } from "./helpers";

const ops = createPlatformOperations({
  listCompatibleModels: async () => [],
});

const admin = createPlatformContext({
  actor: { type: "user", userId: `admin_${createId()}` },
  platformRole: "superadmin",
});

describe("billingFinancials platform operation", () => {
  it("returns unconfigured financial data when Stripe secret key is not set", async () => {
    const result = await executePlatform({
      operation: ops.getBillingFinancials,
      input: {},
      context: admin,
    });
    const financials = unwrap({ result });
    expect(financials).toBeDefined();
    expect(financials.available).toBeInstanceOf(Array);
    expect(financials.pending).toBeInstanceOf(Array);
    expect(financials.recentTransactions).toBeInstanceOf(Array);
    expect(financials.recentInvoices).toBeInstanceOf(Array);
    expect(financials.products).toBeDefined();
    expect(financials.products.monthly.key).toBe("baseMonthly");
    expect(financials.products.yearly.key).toBe("baseYearly");
    expect(financials.products.extraSeats.key).toBe("seatMonthly");
  });
});
