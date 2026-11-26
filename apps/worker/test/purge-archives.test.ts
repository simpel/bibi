import { archiveVenue, createVenue, execute } from "@bibi/core";
import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { JOBS } from "../src/jobs";
import { purgeArchivesJob } from "../src/jobs/purge-archives";
import { provisionedOrg } from "./expired-order";

const db = getDb();

describe("archive.purgeExpired job (ADR 0027, 0118)", () => {
  it("is scheduled nightly", () => {
    expect(JOBS).toContain(purgeArchivesJob);
    expect(purgeArchivesJob.cron).toBe("0 3 * * *");
  });

  it("deletes records archived longer than the retention, as SYSTEM", async () => {
    const context = await provisionedOrg();
    const make = async ({ name }: { name: string }) => {
      const created = await execute({ operation: createVenue, input: { name }, context });
      if (!created.ok) throw created.error;
      await execute({ operation: archiveVenue, input: { id: created.value.id }, context });
      return created.value.id;
    };
    const old = await make({ name: "Old hall" });
    const recent = await make({ name: "New hall" });
    const longAgo = new Date(Date.now() - 91 * 86_400_000);
    await db.venue.update({ where: { id: old }, data: { archivedAt: longAgo } });
    // Only this test's organization: the test database is shared with other suites running now.
    await purgeArchivesJob.handler({ db, organizationIds: [context.organizationId] });
    expect(await db.venue.findUnique({ where: { id: old } })).toBeNull();
    expect((await db.venue.findUnique({ where: { id: recent } }))?.status).toBe("ARCHIVED");
    const audit = await db.auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "venue.delete" },
    });
    expect(audit.map((row) => [row.entityId, row.actorType])).toEqual([[old, "SYSTEM"]]);
  });
});
