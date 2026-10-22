import { execute, expireTicketHolds } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { forEachOrganization } from "../for-each-organization";
import type { JobDefinition } from "../job-definition";

/** Runs `ticket.expireHolds` for every organization as SYSTEM every 15 minutes (ADR 0027, 0044). */
export const expireTicketHoldsJob: JobDefinition = {
  name: "ticket.expireHolds",
  cron: "*/15 * * * *",
  handler: async ({ db }) => {
    const { succeeded, failed } = await forEachOrganization({
      db,
      run: ({ context }) => execute({ operation: expireTicketHolds, input: {}, context }),
    });
    getLogger().info({ event: "ticket.expireHoldsRun", succeeded, failed });
  },
};
