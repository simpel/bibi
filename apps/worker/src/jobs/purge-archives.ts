import { purgeExpiredArchives } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { forEachOrganization } from "../for-each-organization";
import type { JobDefinition } from "../job-definition";

/**
 * Deletes archived records older than each organization's `archiveRetentionDays` (ADR 0118),
 * nightly, as SYSTEM. Records still in use and money records stay; they are tried next night.
 */
export const purgeArchivesJob: JobDefinition = {
  name: "archive.purgeExpired",
  cron: "0 3 * * *",
  handler: async ({ db, organizationIds }) => {
    const totals = { deleted: 0, skipped: 0, failed: 0 };
    const { succeeded, failed } = await forEachOrganization({
      db,
      organizationIds,
      run: async ({ context }) => {
        const result = await purgeExpiredArchives({ context });
        if (result.ok) {
          totals.deleted += result.value.deleted;
          totals.skipped += result.value.skipped;
          totals.failed += result.value.failed;
        }
        return result;
      },
    });
    getLogger().info({
      event: "archive.purgeExpiredRun",
      succeeded,
      failed,
      records: totals,
    });
  },
};
