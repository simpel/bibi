import { getDb, pseudonymiseAuditLog, REDACTED } from "@okazi/db";
import { type CapturedLogs, captureLogs } from "@okazi/logger";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JOBS } from "../src/jobs";
import { pseudonymiseAuditLogJob } from "../src/jobs/pseudonymise-audit-log";

const db = getDb();
const DAY = 86_400_000;
let logs: CapturedLogs;

beforeEach(() => {
  logs = captureLogs();
});
afterEach(() => logs.restore());

type SeedInput = { organizationId: string; ageDays: number; email: string };

function seedRow({ organizationId, ageDays, email }: SeedInput) {
  return db.auditLog.create({
    data: {
      organizationId,
      actorType: "USER",
      actorId: "user_1",
      operation: "customer.update",
      entityType: "customer",
      entityId: "cust_1",
      before: { id: "cust_1", name: "Anna Svensson", email, creditLimitMinor: 100 },
      after: { id: "cust_1", name: "Anna Svensson", email, creditLimitMinor: 200 },
      requestId: "req_1",
      surface: "web",
      createdAt: new Date(Date.now() - ageDays * DAY),
    },
  });
}

describe("AuditLog pseudonymisation (ADR 0032)", () => {
  it("redacts personal values in rows older than the cutoff only, once", async () => {
    const organizationId = `org_${createId()}`;
    const old = await seedRow({ organizationId, ageDays: 400, email: "anna@example.com" });
    const recent = await seedRow({ organizationId, ageDays: 10, email: "bo@example.com" });
    const createdBefore = new Date(Date.now() - 365 * DAY);

    const first = await pseudonymiseAuditLog({ db, createdBefore, batchSize: 1 });
    expect(first.pseudonymised).toBeGreaterThanOrEqual(1);

    const redacted = await db.auditLog.findUniqueOrThrow({ where: { id: old.id } });
    expect(redacted.before).toEqual({
      id: "cust_1",
      name: REDACTED,
      email: REDACTED,
      creditLimitMinor: 100,
    });
    expect(redacted.after).toMatchObject({ email: REDACTED, creditLimitMinor: 200 });
    expect(redacted.pseudonymisedAt).toBeInstanceOf(Date);
    const kept = ["actorType", "actorId", "operation", "entityType", "entityId"] as const;
    for (const key of [...kept, "requestId", "surface", "createdAt", "organizationId"] as const) {
      expect(redacted[key]).toEqual(old[key]);
    }

    const untouched = await db.auditLog.findUniqueOrThrow({ where: { id: recent.id } });
    expect(untouched.after).toMatchObject({ email: "bo@example.com" });
    expect(untouched.pseudonymisedAt).toBeNull();

    expect(await pseudonymiseAuditLog({ db, createdBefore })).toEqual({ pseudonymised: 0 });
  });

  it("is a scheduled worker job that logs how many rows it redacted", async () => {
    expect(JOBS).toContain(pseudonymiseAuditLogJob);
    const organizationId = `org_${createId()}`;
    const old = await seedRow({ organizationId, ageDays: 800, email: "cia@example.com" });
    await pseudonymiseAuditLogJob.handler({ db });
    const row = await db.auditLog.findUniqueOrThrow({ where: { id: old.id } });
    expect(row.before).toMatchObject({ email: REDACTED });
    const [event] = logs.events({ event: "auditLog.pseudonymised" });
    expect(event?.count).toBeGreaterThanOrEqual(1);
    expect(event?.days).toBe(365);
  });
});
