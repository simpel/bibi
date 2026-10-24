import { effectiveTimeZone } from "@bibi/core";
import type { Db } from "@bibi/db";
import type { PgBoss } from "pg-boss";
import type { JobDefinition } from "./job-definition";
import { runJob } from "./run-job";

export type RegisterJobsInput = { boss: PgBoss; db: Db; jobs: readonly JobDefinition[] };

/**
 * Creates each queue, schedules it and starts its worker. Idempotent. Jobs span every
 * organization, so the schedule's zone is the resolver's zone without an organization (ADR 0064).
 */
export async function registerJobs({ boss, db, jobs }: RegisterJobsInput): Promise<void> {
  const tz = effectiveTimeZone({});
  for (const job of jobs) {
    await boss.createQueue(job.name, { retryLimit: job.retryLimit ?? 2 });
    await boss.schedule(job.name, job.cron, null, { tz });
    await boss.work(job.name, async () => {
      await runJob({ name: job.name, run: () => job.handler({ db }) });
    });
  }
}
