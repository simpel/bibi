import { getEnv } from "@bibi/config";
import { createVenue, execute, ok } from "@bibi/core";
import { getDb } from "@bibi/db";
import { type CapturedLogs, captureLogs } from "@bibi/logger";
import { createId } from "@paralleldrive/cuid2";
import { PgBoss } from "pg-boss";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { forEachOrganization } from "../src/for-each-organization";
import type { JobDefinition } from "../src/job-definition";
import { registerJobs } from "../src/register-jobs";
import { runJob } from "../src/run-job";

const db = getDb();
const suffix = createId();
const orgIds = [`org_${suffix}_a`, `org_${suffix}_b`];
const QUEUE = `test.create-venue.${suffix}`;
let boss: PgBoss;
let logs: CapturedLogs;

beforeAll(async () => {
  for (const id of orgIds) {
    await db.organization.create({ data: { id, name: id, slug: id, createdAt: new Date() } });
  }
  boss = new PgBoss({ connectionString: getEnv().DATABASE_URL, schema: "pgboss" });
  await boss.start();
});
afterAll(async () => {
  await boss.stop({ graceful: false });
});
beforeEach(() => {
  logs = captureLogs();
});
afterEach(() => logs.restore());

const createVenueJob: JobDefinition = {
  name: QUEUE,
  cron: "0 3 * * *",
  handler: async ({ db: client }) => {
    await forEachOrganization({
      db: client,
      // Only this test's orgs: other test files' orgs (e.g. the demo seed) share the database.
      run: async ({ context }) =>
        orgIds.includes(context.organizationId)
          ? execute({ operation: createVenue, input: { name: "Job venue" }, context })
          : ok({ value: null }),
    });
  },
};

function waitFor<T>({ probe }: { probe: () => Promise<T | undefined> }): Promise<T> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 20_000;
    const tick = async () => {
      const value = await probe();
      if (value !== undefined) return resolve(value);
      if (Date.now() > deadline) return reject(new Error("timed out"));
      setTimeout(tick, 200);
    };
    void tick();
  });
}

describe("worker (ADR 0027)", () => {
  it("runs a scheduled job once through core as SYSTEM with a system log row", async () => {
    await registerJobs({ boss, db, jobs: [createVenueJob] });
    const schedules = await boss.getSchedules(QUEUE);
    expect(schedules[0]?.cron).toBe("0 3 * * *");
    expect(schedules[0]?.timezone).toBe("Europe/Stockholm");

    const completedVenueEvents = () =>
      logs
        .events({ event: "operation.completed" })
        .filter((entry) => entry.operation === "venue.create");

    await boss.send(QUEUE);
    // The audit row is committed before `operation.completed` is logged, so wait for both.
    const rows = await waitFor({
      probe: async () => {
        const found = await db.auditLog.findMany({
          where: { organizationId: { in: orgIds }, operation: "venue.create" },
        });
        const settled =
          found.length >= orgIds.length && completedVenueEvents().length >= orgIds.length;
        return settled ? found : undefined;
      },
    });
    expect(rows).toHaveLength(orgIds.length);
    expect(new Set(rows.map((row) => row.organizationId))).toEqual(new Set(orgIds));
    for (const row of rows) {
      expect(row.actorType).toBe("SYSTEM");
      expect(row.surface).toBe("system");
      expect(row.requestId).toBeTruthy();
    }
    expect(new Set(rows.map((row) => row.requestId)).size).toBe(1);

    const completed = completedVenueEvents();
    expect(completed.length).toBeGreaterThanOrEqual(orgIds.length);
    expect(completed[0]).toMatchObject({ surface: "system", actorType: "system" });
    expect(completed[0]?.requestId).toBe(rows[0]?.requestId);
  });

  it("does not stop other organizations when one fails", async () => {
    const seen: string[] = [];
    const output = await forEachOrganization({
      db,
      run: async ({ context }) => {
        if (!orgIds.includes(context.organizationId)) return { ok: true, value: null } as never;
        seen.push(context.organizationId);
        if (context.organizationId === orgIds[0]) throw new Error("boom");
        return { ok: true, value: null } as never;
      },
    });
    expect(output.failed).toBe(1);
    expect(seen).toEqual(orgIds);
    const failed = logs.events({ event: "job.organizationFailed" });
    expect(failed.map((entry) => entry.organizationId)).toEqual([orgIds[0]]);
  });

  it("runs only the given organizations when asked", async () => {
    const seen: string[] = [];
    const only = orgIds.slice(0, 1);
    const run = async ({ context }: { context: { organizationId: string } }) =>
      ({ ok: true, value: seen.push(context.organizationId) }) as never;
    const output = await forEachOrganization({ db, run, organizationIds: only });
    expect(seen).toEqual(only);
    expect(output).toEqual({ succeeded: 1, failed: 0 });
  });

  it("gives each job its own request id and logs failures", async () => {
    const ids: unknown[] = [];
    for (let i = 0; i < 2; i++) {
      await runJob({ name: "test.job", run: async () => void ids.push(i) });
    }
    const started = logs.events({ event: "job.started" });
    expect(started).toHaveLength(2);
    expect(started[0]?.requestId).not.toBe(started[1]?.requestId);
    expect(started[0]?.surface).toBe("system");
    await expect(
      runJob({
        name: "test.fail",
        run: async () => {
          throw new Error("x");
        },
      }),
    ).rejects.toThrow("x");
    expect(logs.events({ event: "job.failed" })).toHaveLength(1);
  });
});
