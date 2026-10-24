import type { Db } from "@bibi/db";

export type JobHandlerInput = {
  db: Db;
  /**
   * Per-organization jobs run only these; left out = every organization (the scheduler). Tests
   * pass their own, so a run never changes another test's data in the shared test database.
   */
  organizationIds?: readonly string[] | undefined;
};

/** A queue plus its schedule, defined in code (ADR 0027). No schedules live in Coolify's UI. */
export type JobDefinition = {
  /** Queue name, e.g. `ticket.expireHolds`. */
  name: string;
  /** Cron expression, evaluated in the zone `effectiveTimeZone({})` resolves (no organization). */
  cron: string;
  /** Retries before the job is marked failed. */
  retryLimit?: number;
  handler: (input: JobHandlerInput) => Promise<void>;
};
