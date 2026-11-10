import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it, vi } from "vitest";
import { forEachOrganization } from "../src/for-each-organization";
import { JOBS } from "../src/jobs";
import { paymentRefundRetryJob } from "../src/jobs/payment-refund-retry";

const db = getDb();

vi.mock("../src/for-each-organization", async (original) => {
  const actual = await original<typeof import("../src/for-each-organization")>();
  return { forEachOrganization: vi.fn(actual.forEachOrganization) };
});

describe("payment.refundRetry job (ADR 0027, 0100)", () => {
  it("is scheduled every 15 minutes", () => {
    expect(JOBS).toContain(paymentRefundRetryJob);
    expect(paymentRefundRetryJob.cron).toBe("*/15 * * * *");
  });

  it("retries refunds and voids for each organization as SYSTEM", async () => {
    const id = `org_${createId()}`;
    await db.organization.create({ data: { id, name: id, slug: id, createdAt: new Date() } });
    await paymentRefundRetryJob.handler({ db, organizationIds: [id] });
    const run = vi.mocked(forEachOrganization).mock.results.at(-1)?.value;
    expect(await run).toEqual({ succeeded: 1, failed: 0 });
  });
});
