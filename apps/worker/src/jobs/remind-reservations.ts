import { execute, remindReservations } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { forEachOrganization } from "../for-each-organization";
import type { JobDefinition } from "../job-definition";

/** Mails tomorrow's table guests a reminder with their manage link (ADR 0119), hourly, as SYSTEM. */
export const remindReservationsJob: JobDefinition = {
  name: "reservation.sendReminders",
  cron: "5 * * * *",
  handler: async ({ db, organizationIds }) => {
    let reminded = 0;
    const { succeeded, failed } = await forEachOrganization({
      db,
      organizationIds,
      run: async ({ context }) => {
        const result = await execute({ operation: remindReservations, input: {}, context });
        if (result.ok) reminded += result.value.ids.length;
        return result;
      },
    });
    getLogger().info({ event: "reservation.sendRemindersRun", succeeded, failed, reminded });
  },
};
