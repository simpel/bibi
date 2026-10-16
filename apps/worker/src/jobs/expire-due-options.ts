import { execute, expireDueOptions } from "@okazi/core";
import { getLogger } from "@okazi/logger";
import { forEachOrganization } from "../for-each-organization";
import type { JobDefinition } from "../job-definition";

/** Runs `option.expireDue` for every organization as SYSTEM every 15 minutes (ADR 0022, 0027). */
export const expireDueOptionsJob: JobDefinition = {
  name: "option.expireDue",
  cron: "*/15 * * * *",
  handler: async ({ db }) => {
    const { succeeded, failed } = await forEachOrganization({
      db,
      run: ({ context }) => execute({ operation: expireDueOptions, input: {}, context }),
    });
    getLogger().info({ event: "option.expireDueRun", succeeded, failed });
  },
};
