import type { Db } from "@okazi/db";
import type { PgBoss } from "pg-boss";
import { type JobDefinition, SCHEDULE_TIME_ZONE } from "./job-definition";
import { runJob } from "./run-job";

export type RegisterJobsInput = { boss: PgBoss; db: Db; jobs: readonly JobDefinition[] };

/** Creates each queue, schedules it (Europe/Stockholm) and starts its worker. Idempotent. */
export async function registerJobs({ boss, db, jobs }: RegisterJobsInput): Promise<void> {
  for (const job of jobs) {
    await boss.createQueue(job.name, { retryLimit: job.retryLimit ?? 2 });
    await boss.schedule(job.name, job.cron, null, { tz: SCHEDULE_TIME_ZONE });
    await boss.work(job.name, async () => {
      await runJob({ name: job.name, run: () => job.handler({ db }) });
    });
  }
}
