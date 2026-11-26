import { eraseReservationBookers, execute } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { forEachOrganization } from "../for-each-organization";
import type { JobDefinition } from "../job-definition";

/** Erases the booker data of table reservations 90 days after the visit (ADR 0119), nightly, as SYSTEM. */
export const eraseReservationBookersJob: JobDefinition = {
  name: "reservation.eraseBookers",
  cron: "30 3 * * *",
  handler: async ({ db, organizationIds }) => {
    let erased = 0;
    const { succeeded, failed } = await forEachOrganization({
      db,
      organizationIds,
      run: async ({ context }) => {
        const result = await execute({ operation: eraseReservationBookers, input: {}, context });
        if (result.ok) erased += result.value.erased;
        return result;
      },
    });
    getLogger().info({ event: "reservation.eraseBookersRun", succeeded, failed, erased });
  },
};
