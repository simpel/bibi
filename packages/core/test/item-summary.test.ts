import { describe, expect, it } from "vitest";
import {
  archiveItem,
  createEntityType,
  createVenue,
  execute,
  summarizeItems,
  updateEntityType,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";

describe("item.summary", () => {
  it("counts a venue's active catalog items per type, most first, with the first names", async () => {
    const context = testContext();
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "Hall" }, context }),
    });
    const other = unwrap({
      result: await execute({ operation: createVenue, input: { name: "Other" }, context }),
    });
    const type = async ({ name }: { name: string }) =>
      unwrap({
        result: await execute({
          operation: createEntityType,
          input: { base: "ITEM", name },
          context,
        }),
      });
    const room = await type({ name: "Room" });
    const dish = await type({ name: "Dish" });
    type AddInput = { entityTypeId: string; name: string; venueId?: string };
    const add = ({ entityTypeId, name, venueId = venue.id }: AddInput) =>
      createTestItem({ context, entityTypeId, name, venueId });
    for (const name of ["Soup", "Bread", "Cake", "Apple"])
      await add({ entityTypeId: dish.id, name });
    await add({ entityTypeId: room.id, name: "Vinga" });
    const gone = await add({ entityTypeId: room.id, name: "Archived" });
    await add({ entityTypeId: room.id, name: "Elsewhere", venueId: other.id });
    unwrap({ result: await execute({ operation: archiveItem, input: { id: gone.id }, context }) });

    const summary = unwrap({
      result: await execute({ operation: summarizeItems, input: { venueId: venue.id }, context }),
    });
    expect(summary).toEqual({
      total: 5,
      types: [
        { entityTypeId: dish.id, count: 4, sampleNames: ["Apple", "Bread", "Cake"] },
        { entityTypeId: room.id, count: 1, sampleNames: ["Vinga"] },
      ],
    });
  });

  it("returns NOT_FOUND for an unknown venue", async () => {
    const context = testContext();
    const result = await execute({
      operation: summarizeItems,
      input: { venueId: "missing" },
      context,
    });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });
});

describe("entity type plural name", () => {
  it("stores, trims and clears the plural name", async () => {
    const context = testContext();
    const created = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Room", pluralName: " Rooms " },
        context,
      }),
    });
    expect(created.pluralName).toBe("Rooms");
    const cleared = unwrap({
      result: await execute({
        operation: updateEntityType,
        input: { id: created.id, pluralName: null },
        context,
      }),
    });
    expect(cleared.pluralName).toBeNull();
    const plain = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Dish" },
        context,
      }),
    });
    expect(plain.pluralName).toBeNull();
  });
});
