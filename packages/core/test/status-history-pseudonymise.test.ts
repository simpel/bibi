import { getDb, pseudonymiseAuditLog } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { createTestTicket, moveToStatus, ticketSetup } from "./ticket-helpers";

const DAY = 86_400_000;

describe("status history and audit pseudonymisation (ADR 0032, 0054)", () => {
  it("leaves the status history intact when the audit log is pseudonymised", async () => {
    const { context, type, customer } = await ticketSetup();
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    await moveToStatus({
      context,
      ticketId: ticket.id,
      name: "Lost",
      reason: "Anna chose another venue",
    });
    const db = getDb();
    const where = { organizationId: context.organizationId };
    const history = await db.ticketStatusChange.findMany({ where, orderBy: { seq: "asc" } });
    expect(history).toHaveLength(2);
    // Age this organization's audit rows past the retention cutoff (ADR 0032).
    await db.auditLog.updateMany({ where, data: { createdAt: new Date(Date.now() - 400 * DAY) } });
    const createdBefore = new Date(Date.now() - 365 * DAY);
    await pseudonymiseAuditLog({ db, createdBefore, batchSize: 1000 });
    const audited = await db.auditLog.findMany({ where });
    expect(audited.length).toBeGreaterThan(0);
    expect(audited.every((row) => row.pseudonymisedAt !== null)).toBe(true);
    expect(await db.ticketStatusChange.findMany({ where, orderBy: { seq: "asc" } })).toEqual(
      history,
    );
    const after = await db.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
    expect(after.statusId).toBe(history[1]?.toStatusId);
  });
});
