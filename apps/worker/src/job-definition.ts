import type { Db } from "@okazi/db";

export type JobHandlerInput = { db: Db };

/** A queue plus its schedule, defined in code (ADR 0027). No schedules live in Coolify's UI. */
export type JobDefinition = {
  /** Queue name, e.g. `system.heartbeat`. */
  name: string;
  /** Cron expression, evaluated in `SCHEDULE_TIME_ZONE`. */
  cron: string;
  /** Retries before the job is marked failed. */
  retryLimit?: number;
  handler: (input: JobHandlerInput) => Promise<void>;
};

export const SCHEDULE_TIME_ZONE = "Europe/Stockholm";
