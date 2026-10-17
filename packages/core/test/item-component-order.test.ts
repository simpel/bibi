import { describe, expect, it } from "vitest";
import {
  createEntityType,
  createItem,
  type ExecuteContext,
  execute,
  getItem,
  updateItem,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";

type Ctx = { context: ExecuteContext };

async function setup({ context }: Ctx) {
  const pkg = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Package", behaviours: ["COMPOSABLE"] },
      context,
    }),
  });
  const dish = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Dish" },
      context,
    }),
  });
  const names = ["Coffee", "Lunch", "Cake", "Fruit", "Water"];
  const parts = [];
  for (const name of names) {
    parts.push(await createTestItem({ context, entityTypeId: dish.id, name }));
  }
  const parent = unwrap({
    result: await execute({
      operation: createItem,
      input: { entityTypeId: pkg.id, name: "Day package" },
      context,
    }),
  });
  return { parentId: parent.id, partIds: parts.map((part) => part.id) };
}

type SaveInput = Ctx & { id: string; partIds: string[] };

async function save({ context, id, partIds }: SaveInput) {
  const components = partIds.map((itemId) => ({ itemId, offsetMinutes: 60 }));
  const saved = unwrap({
    result: await execute({ operation: updateItem, input: { id, components }, context }),
  });
  return saved.components.map((part) => part.itemId);
}

describe("item component order (issue #147)", () => {
  it("keeps parts with equal offsets in the order they were given, across saves", async () => {
    const context = testContext();
    const { parentId, partIds } = await setup({ context });
    const given = [partIds[3], partIds[0], partIds[4], partIds[2], partIds[1]] as string[];
    expect(await save({ context, id: parentId, partIds: given })).toEqual(given);
    expect(await save({ context, id: parentId, partIds: given })).toEqual(given);
    const read = unwrap({
      result: await execute({ operation: getItem, input: { id: parentId }, context }),
    });
    expect(read.components.map((part) => part.itemId)).toEqual(given);
    const reversed = [...given].reverse();
    expect(await save({ context, id: parentId, partIds: reversed })).toEqual(reversed);
  });

  it("sorts by offset first, then by the given order", async () => {
    const context = testContext();
    const { parentId, partIds } = await setup({ context });
    const [a, b, c] = partIds as [string, string, string];
    const components = [
      { itemId: a, offsetMinutes: 120 },
      { itemId: b, offsetMinutes: 0 },
      { itemId: c, offsetMinutes: 120 },
    ];
    const saved = unwrap({
      result: await execute({
        operation: updateItem,
        input: { id: parentId, components },
        context,
      }),
    });
    expect(saved.components.map((part) => part.itemId)).toEqual([b, a, c]);
  });
});
