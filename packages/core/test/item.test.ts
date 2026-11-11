import { describe, expect, it } from "vitest";
import {
  createEntityType,
  createItem,
  createLayout,
  execute,
  getItem,
  listItems,
  updateItem,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

describe("items (ADR 0021)", () => {
  it("stores capability data only when the type has the capability", async () => {
    const context = testContext();
    const dish = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Dish" },
        context,
      }),
    });
    const priced = await execute({
      operation: createItem,
      input: { entityTypeId: dish.id, name: "Kanelbulle", priceMinor: 3500 },
      context,
    });
    expect(priced.ok ? null : priced.error.issues[0]?.path).toBe("priceMinor");
    const plain = await execute({
      operation: createItem,
      input: { entityTypeId: dish.id, name: "Kanelbulle", priceMinor: null },
      context,
    });
    expect(errorCode({ result: plain })).toBeNull();
  });

  it("keeps a room's people limit, lists its layouts largest first and filters by capability", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const created = unwrap({
      result: await execute({
        operation: createItem,
        input: {
          entityTypeId: room.id,
          name: "Vinga",
          priceMinor: 450_000,
          priceUnit: "PER_HOUR",
          maxPeople: 250,
        },
        context,
      }),
    });
    expect(created).toMatchObject({ maxPeople: 250, layouts: [] });
    const layout = ({ name, capacity }: { name: string; capacity: number }) =>
      execute({ operation: createLayout, input: { itemId: created.id, name, capacity }, context });
    const theatre = unwrap({ result: await layout({ name: "Theatre", capacity: 220 }) });
    const mingel = unwrap({ result: await layout({ name: "Mingel", capacity: 250 }) });
    const read = unwrap({
      result: await execute({ operation: getItem, input: { id: created.id }, context }),
    });
    const manual = { capacitySource: "MANUAL" };
    expect(read.layouts).toEqual([
      { layoutId: mingel.id, name: "Mingel", effectiveCapacity: 250, ...manual },
      { layoutId: theatre.id, name: "Theatre", effectiveCapacity: 220, ...manual },
    ]);
    const updated = unwrap({
      result: await execute({
        operation: updateItem,
        input: { id: created.id, maxPeople: 260 },
        context,
      }),
    });
    expect(updated).toMatchObject({ maxPeople: 260, priceMinor: 450_000 });
    const bookable = unwrap({
      result: await execute({ operation: listItems, input: { capability: "BOOKABLE" }, context }),
    });
    expect(bookable.items.map((item) => item.id)).toEqual([created.id]);
    const bundles = unwrap({
      result: await execute({ operation: listItems, input: { capability: "BUNDLE" }, context }),
    });
    expect(bundles.items).toHaveLength(0);
    const other = await execute({
      operation: getItem,
      input: { id: created.id },
      context: testContext(),
    });
    expect(errorCode({ result: other })).toBe("NOT_FOUND");
  });

  it("bounds the number of field values at the boundary", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const fields = Object.fromEntries(Array.from({ length: 201 }, (_, i) => [`f${i}`, 1]));
    const result = await execute({
      operation: createItem,
      input: { entityTypeId: room.id, name: "Stor", fields },
      context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
  });
});
