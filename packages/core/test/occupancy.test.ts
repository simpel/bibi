import { describe, expect, it } from "vitest";
import {
  archiveOccupancy,
  createEntityType,
  createOccupancy,
  execute,
  getOccupancy,
  listOccupancies,
  updateOccupancy,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createHoldLine, insertHold } from "./hold-helpers";
import { createTestItem } from "./item-helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { ticketSetup } from "./ticket-helpers";

describe("occupancy (ADR 0022)", () => {
  it("blocks an item and rejects overlapping non-option periods", async () => {
    const { context } = await ticketSetup();
    const item = await createBookableItem({ context });
    const block = { itemId: item.id, type: "MAINTENANCE" as const, ...hours({ from: 8, to: 12 }) };
    const created = unwrap({
      result: await execute({ operation: createOccupancy, input: block, context }),
    });
    expect(created).toMatchObject({ type: "MAINTENANCE", status: "ACTIVE", lineId: null });
    const overlap = { ...block, type: "INTERNAL" as const, ...hours({ from: 11, to: 13 }) };
    const clash = await execute({ operation: createOccupancy, input: overlap, context });
    expect(errorCode({ result: clash })).toBe("CONFLICT");
    const after = { ...overlap, ...hours({ from: 12, to: 13 }) };
    const adjacent = await execute({ operation: createOccupancy, input: after, context });
    expect(errorCode({ result: adjacent })).toBeNull();
    const held = await createHoldLine({ context, itemId: item.id, hold: "HARD", from: 9, to: 10 });
    expect(errorCode({ result: held })).toBe("CONFLICT");
  });

  it("lets options overlap each other and blocked periods", async () => {
    const { context } = await ticketSetup();
    const item = await createBookableItem({ context });
    const input = { itemId: item.id, type: "INTERNAL" as const, ...hours({ from: 8, to: 12 }) };
    unwrap({ result: await execute({ operation: createOccupancy, input, context }) });
    await insertHold({ context, itemId: item.id, hold: "SOFT", from: 9, to: 11 });
    await insertHold({ context, itemId: item.id, hold: "SOFT", from: 10, to: 14 });
    const list = unwrap({
      result: await execute({
        operation: listOccupancies,
        input: { itemId: item.id, from: hours({ from: 10, to: 11 }).startsAt },
        context,
      }),
    });
    expect(list.items.map((row) => row.type)).toEqual(["INTERNAL", "HOLD", "HOLD"]);
  });

  it("saves only one of several concurrent overlapping blocks", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const input = { itemId: item.id, type: "INTERNAL" as const, ...hours({ from: 8, to: 10 }) };
    const attempts = [1, 2, 3, 4].map(() =>
      execute({ operation: createOccupancy, input, context }),
    );
    const codes = (await Promise.all(attempts)).map((result) => errorCode({ result })).sort();
    expect(codes).toEqual(["CONFLICT", "CONFLICT", "CONFLICT", null]);
    const saved = unwrap({
      result: await execute({ operation: listOccupancies, input: { itemId: item.id }, context }),
    });
    expect(saved.items).toHaveLength(1);
  });

  it("updates and releases manual blocks, never other types", async () => {
    const { context } = await ticketSetup();
    const item = await createBookableItem({ context });
    const input = { itemId: item.id, type: "MAINTENANCE" as const, ...hours({ from: 8, to: 10 }) };
    const block = unwrap({ result: await execute({ operation: createOccupancy, input, context }) });
    const moved = unwrap({
      result: await execute({
        operation: updateOccupancy,
        input: { id: block.id, endsAt: hours({ from: 8, to: 11 }).endsAt, note: "Painting" },
        context,
      }),
    });
    expect(moved).toMatchObject({ note: "Painting", startsAt: input.startsAt });
    const inverted = { id: block.id, startsAt: hours({ from: 12, to: 13 }).startsAt };
    const bad = await execute({ operation: updateOccupancy, input: inverted, context });
    expect(bad.ok ? null : bad.error.issues[0]?.path).toBe("endsAt");
    unwrap({ result: await execute({ operation: archiveOccupancy, input: block, context }) });
    const gone = await execute({ operation: getOccupancy, input: block, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
    const ticket = await insertHold({ context, itemId: item.id, hold: "HARD", from: 8, to: 9 });
    const locked = await execute({ operation: archiveOccupancy, input: ticket, context });
    expect(errorCode({ result: locked })).toBe("CONFLICT");
  });

  it("only occupies bookable items of the own organization", async () => {
    const context = testContext();
    const input = { base: "ITEM" as const, name: "Dish" };
    const dishType = unwrap({
      result: await execute({ operation: createEntityType, input, context }),
    });
    const dish = await createTestItem({ context, entityTypeId: dishType.id, name: "Soup" });
    const block = { itemId: dish.id, type: "INTERNAL" as const, ...hours({ from: 8, to: 9 }) };
    const refused = await execute({ operation: createOccupancy, input: block, context });
    expect(refused.ok ? null : refused.error.issues[0]?.path).toBe("itemId");
    const item = await createBookableItem({ context });
    const own = { ...block, itemId: item.id };
    const created = unwrap({
      result: await execute({ operation: createOccupancy, input: own, context }),
    });
    const other = testContext();
    const get = await execute({ operation: getOccupancy, input: created, context: other });
    expect(errorCode({ result: get })).toBe("NOT_FOUND");
    const leak = await execute({ operation: createOccupancy, input: own, context: other });
    expect(errorCode({ result: leak })).toBe("VALIDATION");
  });
});
