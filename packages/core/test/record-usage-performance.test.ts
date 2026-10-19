import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { recordsMatching } from "../src/features/field-definition/field-usage";
import { createTypeWithField } from "./customer-helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";

const LINES = 50_000;
/** Every this-many-th line has a value for the field. */
const EVERY = 1_000;

type BulkInput = { organizationId: string; entityTypeId: string; ticketId: string; key: string };

/** 50 000 lines of one type with their `Record` rows, in two statements. */
async function insertLines({ organizationId, entityTypeId, ticketId, key }: BulkInput) {
  const db = getDb();
  await db.$executeRaw`
    INSERT INTO "Record" ("id", "organizationId", "entityTypeId", "base", "fields", "updatedAt")
    SELECT ${organizationId} || '-line-' || g, ${organizationId}, ${entityTypeId}, 'LINE',
      CASE WHEN g % ${EVERY} = 0 THEN jsonb_build_object(${key}::text, 'x') ELSE '{}' END, now()
    FROM generate_series(1, ${LINES}) AS g`;
  await db.$executeRaw`
    INSERT INTO "Line" ("id", "organizationId", "ticketId", "entityTypeId", "name", "startsAt",
      "endsAt", "fields", "updatedAt")
    SELECT "id", "organizationId", ${ticketId}, "entityTypeId", 'Line', now(),
      now() + interval '1 hour', "fields", now()
    FROM "Record" WHERE "organizationId" = ${organizationId} AND "base" = 'LINE'`;
  await db.$executeRaw`ANALYZE "Record"`;
}

describe("field usage on the record supertable (ADR 0056)", () => {
  it("checks a field over 50 000 lines in under 50 ms", { timeout: 120_000 }, async () => {
    const { context, type, customer } = await ticketSetup();
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const line = await createTypeWithField({ context, base: "LINE", name: "Session" });
    const entityTypeId = line.type.id;
    const { organizationId } = context;
    await insertLines({ organizationId, entityTypeId, ticketId: ticket.id, key: line.key });
    const check = () =>
      recordsMatching({ context, entityTypeId, match: { kind: "has", key: line.key } });
    await check();
    const timings: number[] = [];
    for (let run = 0; run < 5; run += 1) {
      const started = performance.now();
      const usage = await check();
      timings.push(performance.now() - started);
      expect(usage.total).toBe(LINES / EVERY);
    }
    expect(Math.max(...timings)).toBeLessThan(50);
  });
});
