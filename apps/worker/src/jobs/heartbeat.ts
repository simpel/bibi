import { getLogger } from "@okazi/logger";
import type { JobDefinition } from "../job-definition";

/** A no-op that proves the worker and its schedule are alive, until `option.expireDue` exists. */
export const heartbeat: JobDefinition = {
  name: "system.heartbeat",
  cron: "*/15 * * * *",
  handler: async () => {
    getLogger().info({ event: "job.heartbeat" });
  },
};
