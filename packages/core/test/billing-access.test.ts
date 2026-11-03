import { describe, expect, it } from "vitest";
import { deriveAccess } from "../src/features/billing/access";
import { effectiveTrialEnd } from "../src/features/billing/plan";
import { execute, getBillingAccess } from "../src/index";
import { setBillingRow, useMemoryBilling } from "./billing-helpers";
import { unwrap } from "./helpers";
import { testOrg } from "./org-helpers";

const now = new Date("2026-11-03T12:00:00Z");
const later = new Date("2026-11-10T12:00:00Z");
const earlier = new Date("2026-10-01T12:00:00Z");
const base = { exempt: false, subscriptionStatus: null, configured: true, now };

describe("billing access (ADR 0095 §5)", () => {
  it("derives the state from exemption, subscription, trial and configuration", () => {
    expect(deriveAccess({ ...base, trialEndsAt: later })).toBe("TRIAL");
    expect(deriveAccess({ ...base, trialEndsAt: earlier })).toBe("REQUIRED");
    expect(deriveAccess({ ...base, trialEndsAt: earlier, configured: false })).toBe("UNCONFIGURED");
    expect(deriveAccess({ ...base, trialEndsAt: earlier, exempt: true })).toBe("EXEMPT");
    const paid = { ...base, trialEndsAt: earlier };
    expect(deriveAccess({ ...paid, subscriptionStatus: "active" })).toBe("ACTIVE");
    expect(deriveAccess({ ...paid, subscriptionStatus: "trialing" })).toBe("ACTIVE");
    expect(deriveAccess({ ...paid, subscriptionStatus: "past_due" })).toBe("PAST_DUE");
    expect(deriveAccess({ ...paid, subscriptionStatus: "canceled" })).toBe("REQUIRED");
  });

  it("inherits a 14-day trial from the organization's creation unless one is stored", () => {
    const created = new Date("2026-11-01T00:00:00Z");
    expect(effectiveTrialEnd({ organizationCreatedAt: created, trialEndsAt: null })).toEqual(
      new Date("2026-11-15T00:00:00Z"),
    );
    expect(effectiveTrialEnd({ organizationCreatedAt: created, trialEndsAt: later })).toBe(later);
  });
});

describe("billing.access", () => {
  const billing = useMemoryBilling();

  it("is open in the trial, closed after it, and tells whether the caller can pay", async () => {
    const admin = await testOrg();
    const fresh = unwrap({
      result: await execute({ operation: getBillingAccess, input: {}, context: admin }),
    });
    expect(fresh).toMatchObject({ state: "TRIAL", open: true, canPay: true });
    await setBillingRow({ context: admin, data: { trialEndsAt: earlier } });
    const ended = unwrap({
      result: await execute({ operation: getBillingAccess, input: {}, context: admin }),
    });
    expect(ended).toMatchObject({ state: "REQUIRED", open: false });
    const member = { ...admin, permissions: {}, roles: ["member"] };
    const asMember = unwrap({
      result: await execute({ operation: getBillingAccess, input: {}, context: member }),
    });
    expect(asMember).toMatchObject({ open: false, canPay: false });
    billing.gateway().configured = false;
    const unconfigured = unwrap({
      result: await execute({ operation: getBillingAccess, input: {}, context: admin }),
    });
    expect(unconfigured).toMatchObject({ state: "UNCONFIGURED", open: true });
  });
});
