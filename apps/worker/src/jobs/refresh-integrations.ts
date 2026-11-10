import { execute, refreshExpiringIntegrations } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { forEachOrganization } from "../for-each-organization";
import type { JobDefinition } from "../job-definition";

/**
 * Runs `integration.refreshExpiring` for every organization as SYSTEM once a day: it refreshes
 * each OAuth provider's connections whose refresh token ends within that provider's window, so a
 * connection with no traffic outlives it (ADR 0027, 0087, 0100).
 */
export const refreshIntegrationsJob: JobDefinition = {
  name: "integration.refreshExpiring",
  cron: "17 3 * * *",
  handler: async ({ db, organizationIds }) => {
    const { succeeded, failed } = await forEachOrganization({
      db,
      organizationIds,
      run: ({ context }) => execute({ operation: refreshExpiringIntegrations, input: {}, context }),
    });
    getLogger().info({ event: "integration.refreshExpiringRun", succeeded, failed });
  },
};
