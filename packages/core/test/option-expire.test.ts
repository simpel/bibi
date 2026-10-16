import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { execute, expireDueOptions, getOption, listOccupancies } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { createBookableItem } from "./occupancy-helpers";
import { makeOverdue, placeOption } from "./option-helpers";

describe("option.expireDue (ADR 0022)", () => {
  it("expires overdue options, releases their holds and moves the queue up", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const overdue = await placeOption({ context, itemId: item.id, from: 8, to: 12 });
    const waiting = await placeOption({ context, itemId: item.id, from: 9, to: 11 });
    await makeOverdue({ context, id: overdue.id });

    const result = unwrap({
      result: await execute({ operation: expireDueOptions, input: {}, context }),
    });
    expect(result.items.map((option) => [option.id, option.optionStatus])).toEqual([
      [overdue.id, "EXPIRED"],
    ]);
    const next = unwrap({
      result: await execute({ operation: getOption, input: { id: waiting.id }, context }),
    });
    expect(next).toMatchObject({ optionStatus: "ACTIVE", rank: 1 });
    const holds = unwrap({
      result: await execute({ operation: listOccupancies, input: { itemId: item.id }, context }),
    });
    expect(holds.items.map((row) => row.sourceId)).toEqual([waiting.id]);

    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "option.expireDue" },
    });
    const changed = audit.map((row) => [row.entityType, row.entityId]);
    expect(changed).toEqual(
      expect.arrayContaining([
        ["option", overdue.id],
        ["option", waiting.id],
      ]),
    );
    expect(changed.filter(([type]) => type === "occupancy")).toHaveLength(1);
  });

  it("does nothing when no option is due", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    await placeOption({ context, itemId: item.id, from: 8, to: 12 });
    const result = unwrap({
      result: await execute({ operation: expireDueOptions, input: {}, context }),
    });
    expect(result.items).toEqual([]);
  });
});
