import { describe, expect, it } from "vitest";
import { execute, getBookingSeries, listBookingSeries } from "../src/index";
import { blockOccurrence, createS1, S1_START, seriesSetup } from "./booking-series-helpers";
import { errorCode, unwrap } from "./helpers";
import { testOrg } from "./org-helpers";

describe("bookingSeries.create (ADR 0023)", () => {
  it("creates S1 with 10 occurrences and flags the one that clashes with a block", async () => {
    const { context, type, customer, room } = await seriesSetup();
    await blockOccurrence({ context, itemId: room.id, index: 4 });
    const series = unwrap({
      result: await createS1({
        context,
        entityTypeId: type.id,
        customerId: customer.id,
        itemIds: [room.id],
      }),
    });
    expect(series).toMatchObject({ rule: "FREQ=MONTHLY;BYDAY=1TU;COUNT=10", truncated: false });
    expect(series.occurrences).toHaveLength(10);
    expect(series.occurrences.map((o) => o.occurrenceIndex)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(series.occurrences[0]?.startsAt).toEqual(S1_START);
    expect(series.clashes.map((o) => o.occurrenceIndex)).toEqual([4]);
    const bookings = await context.db.booking.findMany({ where: { seriesId: series.id } });
    expect(bookings).toHaveLength(10);
    const references = bookings.map((b) => b.reference).sort((a, b) => a - b);
    expect(new Set(references).size).toBe(10);
    const occupied = await context.db.occupancy.findMany({
      where: { itemId: room.id, type: "BOOKING" },
    });
    expect(occupied).toHaveLength(9);
    const clashing = bookings.find((b) => b.occurrenceIndex === 4);
    expect(clashing?.clash).toBe(true);
    expect(occupied.some((o) => o.sourceId === clashing?.id)).toBe(false);
  });

  it("audits the series and every occurrence", async () => {
    const { context, type, customer, room } = await seriesSetup();
    const input = { context, entityTypeId: type.id, customerId: customer.id, itemIds: [room.id] };
    const series = unwrap({ result: await createS1(input) });
    const audit = await context.db.auditLog.findMany({
      where: { operation: "bookingSeries.create" },
    });
    expect(audit.filter((row) => row.entityId === series.id)).toHaveLength(1);
    expect(audit.filter((row) => row.entityType === "booking")).toHaveLength(10);
  });

  it("refuses unknown items, rules and types without creating anything", async () => {
    const { context, type, customer, room } = await seriesSetup();
    const base = { context, entityTypeId: type.id, customerId: customer.id };
    const noItem = await createS1({ ...base, itemIds: ["nope"] });
    expect(errorCode({ result: noItem })).toBe("VALIDATION");
    const repeated = await createS1({ ...base, itemIds: [room.id, room.id] });
    expect(errorCode({ result: repeated })).toBe("VALIDATION");
    const noType = await createS1({ ...base, entityTypeId: room.entityTypeId, itemIds: [] });
    expect(errorCode({ result: noType })).toBe("VALIDATION");
    expect(await context.db.bookingSeries.count()).toBe(0);
    expect(await context.db.booking.count()).toBe(0);
  });
});

describe("bookingSeries.get and bookingSeries.list", () => {
  it("returns the series with its occurrences, scoped to the organization", async () => {
    const { context, type, customer, room } = await seriesSetup();
    await blockOccurrence({ context, itemId: room.id, index: 2 });
    const input = { context, entityTypeId: type.id, customerId: customer.id, itemIds: [room.id] };
    const created = unwrap({ result: await createS1(input) });
    const got = unwrap({
      result: await execute({ operation: getBookingSeries, input: { id: created.id }, context }),
    });
    expect(got.occurrences).toHaveLength(10);
    expect(got.clashes.map((o) => o.occurrenceIndex)).toEqual([2]);
    const listed = unwrap({
      result: await execute({
        operation: listBookingSeries,
        input: { customerId: customer.id },
        context,
      }),
    });
    expect(listed.items.map((s) => s.id)).toEqual([created.id]);
    const outsider = await testOrg();
    const foreign = await execute({
      operation: getBookingSeries,
      input: { id: created.id },
      context: outsider,
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    const foreignList = unwrap({
      result: await execute({ operation: listBookingSeries, input: {}, context: outsider }),
    });
    expect(foreignList.items).toEqual([]);
  });
});
