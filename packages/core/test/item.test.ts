import { describe, expect, it } from "vitest";
import {
  createEntityType,
  createItem,
  createSetup,
  execute,
  getItem,
  listItems,
  updateItem,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

describe("items (ADR 0021)", () => {
  it("stores behaviour data only when the type has the behaviour", async () => {
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
      input: { entityTypeId: dish.id, name: "Kanelbulle", priceMinor: null, setups: [] },
      context,
    });
    expect(errorCode({ result: plain })).toBeNull();
  });

  it("replaces setup capacities as a set and filters by behaviour", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const theatre = unwrap({
      result: await execute({
        operation: createSetup,
        input: { name: "Theatre", changeoverMinutes: 15 },
        context,
      }),
    });
    const mingel = unwrap({
      result: await execute({ operation: createSetup, input: { name: "Mingel" }, context }),
    });
    const created = unwrap({
      result: await execute({
        operation: createItem,
        input: {
          entityTypeId: room.id,
          name: "Vinga",
          priceMinor: 450_000,
          priceUnit: "PER_HOUR",
          setups: [
            { setupId: theatre.id, capacity: 220 },
            { setupId: mingel.id, capacity: 250 },
          ],
        },
        context,
      }),
    });
    expect(created.setups).toEqual([
      { setupId: mingel.id, capacity: 250 },
      { setupId: theatre.id, capacity: 220 },
    ]);
    const updated = unwrap({
      result: await execute({
        operation: updateItem,
        input: { id: created.id, setups: [{ setupId: theatre.id, capacity: 200 }] },
        context,
      }),
    });
    expect(updated.setups).toEqual([{ setupId: theatre.id, capacity: 200 }]);
    expect(updated.priceMinor).toBe(450_000);
    const twice = await execute({
      operation: updateItem,
      input: {
        id: created.id,
        setups: [
          { setupId: theatre.id, capacity: 1 },
          { setupId: theatre.id, capacity: 2 },
        ],
      },
      context,
    });
    expect(errorCode({ result: twice })).toBe("VALIDATION");
    const bookable = unwrap({
      result: await execute({ operation: listItems, input: { behaviour: "BOOKABLE" }, context }),
    });
    expect(bookable.items.map((item) => item.id)).toEqual([created.id]);
    const composable = unwrap({
      result: await execute({ operation: listItems, input: { behaviour: "COMPOSABLE" }, context }),
    });
    expect(composable.items).toHaveLength(0);
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
