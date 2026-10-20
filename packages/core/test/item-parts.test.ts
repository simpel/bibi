import { describe, expect, it } from "vitest";
import {
  createEntityType,
  createItem,
  type ExecuteContext,
  execute,
  updateEntityType,
  updateItem,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";

type Ctx = { context: ExecuteContext };

async function bundleType({ context }: Ctx) {
  const input = { base: "ITEM" as const, name: "Bundle", capabilities: ["BUNDLE" as const] };
  return unwrap({ result: await execute({ operation: createEntityType, input, context }) });
}

type SetPartsInput = Ctx & { id: string; partIds: string[] };

function setParts({ context, id, partIds }: SetPartsInput) {
  const parts = partIds.map((itemId) => ({ itemId }));
  return execute({ operation: updateItem, input: { id, parts }, context });
}

describe("item parts (ADR 0021)", () => {
  it("replaces parts as a set, only for BUNDLE types", async () => {
    const context = testContext();
    const pkg = await bundleType({ context });
    const plain = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Dish" },
        context,
      }),
    });
    const coffee = await createTestItem({ context, entityTypeId: plain.id, name: "Coffee" });
    const lunch = await createTestItem({ context, entityTypeId: plain.id, name: "Lunch" });
    const created = unwrap({
      result: await execute({
        operation: createItem,
        input: {
          entityTypeId: pkg.id,
          name: "Day bundle",
          parts: [
            { itemId: lunch.id, quantity: 1, offsetMinutes: 180, durationMinutes: 60 },
            { itemId: coffee.id, required: false },
          ],
        },
        context,
      }),
    });
    expect(created.parts).toEqual([
      { itemId: coffee.id, quantity: 1, offsetMinutes: 0, durationMinutes: null, required: false },
      { itemId: lunch.id, quantity: 1, offsetMinutes: 180, durationMinutes: 60, required: true },
    ]);
    const replaced = unwrap({
      result: await setParts({ context, id: created.id, partIds: [coffee.id] }),
    });
    expect(replaced.parts.map((part) => part.itemId)).toEqual([coffee.id]);
    const wrong = await setParts({ context, id: lunch.id, partIds: [coffee.id] });
    expect(wrong.ok ? null : wrong.error.issues[0]?.path).toBe("parts");
    const twice = await setParts({ context, id: created.id, partIds: [coffee.id, coffee.id] });
    expect(errorCode({ result: twice })).toBe("VALIDATION");
  });

  it("rejects cycles", async () => {
    const context = testContext();
    const pkg = await bundleType({ context });
    const a = await createTestItem({ context, entityTypeId: pkg.id, name: "A" });
    const b = await createTestItem({ context, entityTypeId: pkg.id, name: "B" });
    const c = await createTestItem({ context, entityTypeId: pkg.id, name: "C" });
    const self = await setParts({ context, id: a.id, partIds: [a.id] });
    expect(errorCode({ result: self })).toBe("VALIDATION");
    unwrap({ result: await setParts({ context, id: a.id, partIds: [b.id] }) });
    unwrap({ result: await setParts({ context, id: b.id, partIds: [c.id] }) });
    const cycle = await setParts({ context, id: c.id, partIds: [a.id] });
    expect(errorCode({ result: cycle })).toBe("VALIDATION");
  });

  it("rejects more than 5 levels, counting the parents above", async () => {
    const context = testContext();
    const pkg = await bundleType({ context });
    const names = ["L1", "L2", "L3", "L4", "L5", "L6"];
    const items = [];
    for (const name of names) {
      items.push(await createTestItem({ context, entityTypeId: pkg.id, name }));
    }
    const [l1, l2, l3, l4, l5, l6] = items.map((item) => item.id) as string[] as [
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    // Build L2 → L3 → L4 → L5 (4 levels), then hang it under L1 (5 levels).
    unwrap({ result: await setParts({ context, id: l4, partIds: [l5] }) });
    unwrap({ result: await setParts({ context, id: l3, partIds: [l4] }) });
    unwrap({ result: await setParts({ context, id: l2, partIds: [l3] }) });
    unwrap({ result: await setParts({ context, id: l1, partIds: [l2] }) });
    // A sixth level below the bottom is too deep, seen from L5 upwards.
    const deep = await setParts({ context, id: l5, partIds: [l6] });
    expect(errorCode({ result: deep })).toBe("VALIDATION");
    // So is a new bundle containing the five-level L1.
    const top = await execute({
      operation: createItem,
      input: { entityTypeId: pkg.id, name: "Top", parts: [{ itemId: l1 }] },
      context,
    });
    expect(errorCode({ result: top })).toBe("VALIDATION");
  });

  it("keeps BUNDLE on while parts exist", async () => {
    const context = testContext();
    const pkg = await bundleType({ context });
    const a = await createTestItem({ context, entityTypeId: pkg.id, name: "A" });
    const b = await createTestItem({ context, entityTypeId: pkg.id, name: "B" });
    unwrap({ result: await setParts({ context, id: a.id, partIds: [b.id] }) });
    const off = await execute({
      operation: updateEntityType,
      input: { id: pkg.id, capabilities: [] },
      context,
    });
    expect(errorCode({ result: off })).toBe("CONFLICT");
    unwrap({ result: await setParts({ context, id: a.id, partIds: [] }) });
    const offAgain = await execute({
      operation: updateEntityType,
      input: { id: pkg.id, capabilities: [] },
      context,
    });
    expect(errorCode({ result: offAgain })).toBeNull();
  });
});
