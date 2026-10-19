import { execute, getLine } from "@okazi/core";
import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { JOBS } from "../src/jobs";
import { expireTicketHoldsJob } from "../src/jobs/expire-ticket-holds";
import { expiredTicket } from "./expired-ticket";

const db = getDb();

describe("ticket.expireHolds job (ADR 0027, 0044)", () => {
  it("is scheduled every 15 minutes", () => {
    expect(JOBS).toContain(expireTicketHoldsJob);
    expect(expireTicketHoldsJob.cron).toBe("*/15 * * * *");
  });

  it("moves expired soft holds to the expiry state in every organization as SYSTEM", async () => {
    const { context, line, prebooked, expiry } = await expiredTicket();
    const before = await execute({ operation: getLine, input: { id: line.id }, context });
    expect(before.ok && before.value.stateId).toBe(prebooked.id);
    await expireTicketHoldsJob.handler({ db });
    const after = await execute({ operation: getLine, input: { id: line.id }, context });
    expect(after.ok && after.value.stateId).toBe(expiry.id);
    const audit = await db.auditLog.findMany({
      where: {
        organizationId: context.organizationId,
        operation: "ticket.expireHolds",
        entityId: line.id,
      },
    });
    expect(audit.map((row) => row.actorType)).toEqual(["SYSTEM"]);
  });
});
