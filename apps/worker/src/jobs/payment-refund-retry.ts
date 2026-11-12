import { execute, type Result, retryRefunds } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { forEachOrganization } from "../for-each-organization";
import type { JobDefinition } from "../job-definition";

/**
 * Every 15 minutes, per organization as SYSTEM (ADR 0027, 0100): `payment.retryRefunds` resolves
 * refunds stuck PENDING at their provider.
 */
export const paymentRefundRetryJob: JobDefinition = {
  name: "payment.refundRetry",
  cron: "*/15 * * * *",
  handler: async ({ db, organizationIds }) => {
    const { succeeded, failed } = await forEachOrganization({
      db,
      organizationIds,
      run: async ({ context }): Promise<Result<unknown>> => {
        const refunds = await execute({ operation: retryRefunds, input: {}, context });
        if (refunds.ok) {
          const fields = { organizationId: context.organizationId };
          getLogger().debug({ event: "payment.refundRetryOrg", ...fields, refunds: refunds.value });
        }
        return refunds;
      },
    });
    getLogger().info({ event: "payment.refundRetryRun", succeeded, failed });
  },
};
