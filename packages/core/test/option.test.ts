import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  createOption,
  execute,
  getOption,
  listOccupancies,
  listOptions,
  releaseOption,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { placeOption } from "./option-helpers";

const ranks = async ({
  context,
  ids,
}: {
  context: ReturnType<typeof testContext>;
  ids: string[];
}) => {
  const out: Array<number | null> = [];
  for (const id of ids) {
    const option = unwrap({
      result: await execute({ operation: getOption, input: { id }, context }),
    });
    out.push(option.rank);
  }
  return out;
};

describe("option queue (ADR 0022)", () => {
  it("ranks overlapping options 1 and 2 and moves the second up on release", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const first = await placeOption({ context, itemId: item.id, from: 8, to: 12 });
    const second = await placeOption({ context, itemId: item.id, from: 10, to: 14 });
    expect([first.rank, second.rank]).toEqual([1, 2]);
    expect(first.optionStatus).toBe("ACTIVE");

    const released = unwrap({
      result: await execute({ operation: releaseOption, input: { id: first.id }, context }),
    });
    expect(released).toMatchObject({ optionStatus: "RELEASED", rank: null });
    expect(await ranks({ context, ids: [second.id] })).toEqual([1]);

    const holds = unwrap({
      result: await execute({ operation: listOccupancies, input: { itemId: item.id }, context }),
    });
    expect(holds.items.map((row) => [row.type, row.sourceId])).toEqual([["OPTION", second.id]]);
    const audit = await getDb().auditLog.findMany({
      where: { entityId: second.id },
      orderBy: { createdAt: "asc" },
    });
    expect(audit.map((row) => row.operation)).toEqual(["option.create", "option.release"]);
  });

  it("counts only the options that overlap, on the same item", async () => {
    const context = testContext();
    const type = await createRoomType({ context });
    const item = await createTestItem({ context, entityTypeId: type.id, name: "Älvsalen" });
    const other = await createTestItem({ context, entityTypeId: type.id, name: "Kajen" });
    const morning = await placeOption({ context, itemId: item.id, from: 8, to: 10 });
    const afternoon = await placeOption({ context, itemId: item.id, from: 12, to: 14 });
    const elsewhere = await placeOption({ context, itemId: other.id, from: 8, to: 14 });
    const allDay = await placeOption({ context, itemId: item.id, from: 9, to: 13 });
    expect([morning.rank, afternoon.rank, elsewhere.rank, allDay.rank]).toEqual([1, 1, 1, 3]);

    await execute({ operation: releaseOption, input: { id: morning.id }, context });
    expect(await ranks({ context, ids: [afternoon.id, allDay.id] })).toEqual([1, 2]);
  });

  it("serialises concurrent options on one item", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const placed = await Promise.all(
      [0, 1, 2].map(() => placeOption({ context, itemId: item.id, from: 8, to: 12 })),
    );
    expect(placed.map((option) => option.rank).sort()).toEqual([1, 2, 3]);
  });

  it("validates the item, period, expiry and ticket", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const valid = {
      itemId: item.id,
      ...hours({ from: 8, to: 12 }),
      expiresAt: new Date(Date.now() + 86_400_000),
    };
    const cases = [
      { ...valid, itemId: "missing" },
      { ...valid, ...hours({ from: 12, to: 8 }) },
      { ...valid, expiresAt: new Date(Date.now() - 1000) },
      { ...valid, ticketId: "missing" },
    ];
    for (const input of cases) {
      const result = await execute({ operation: createOption, input, context });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
  });

  it("refuses releasing twice and hides options of other organizations", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const option = await placeOption({ context, itemId: item.id, from: 8, to: 12 });
    const input = { id: option.id };
    unwrap({ result: await execute({ operation: releaseOption, input, context }) });
    const again = await execute({ operation: releaseOption, input, context });
    expect(errorCode({ result: again })).toBe("CONFLICT");
    const stranger = testContext();
    const foreign = await execute({ operation: getOption, input, context: stranger });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    const list = unwrap({
      result: await execute({ operation: listOptions, input: {}, context: stranger }),
    });
    expect(list.items).toHaveLength(0);
  });

  it("lists options in queue order and filters by status", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const first = await placeOption({ context, itemId: item.id, from: 8, to: 12 });
    const second = await placeOption({ context, itemId: item.id, from: 8, to: 12 });
    await execute({ operation: releaseOption, input: { id: first.id }, context });
    const input = { itemId: item.id, optionStatus: "ACTIVE" as const };
    const active = unwrap({ result: await execute({ operation: listOptions, input, context }) });
    expect(active.items.map((option) => [option.id, option.rank])).toEqual([[second.id, 1]]);
  });
});
