import { describe, expect, it } from "vitest";
import {
  createSetup,
  execute,
  getItem,
  previewChange,
  type RecordChangePreview,
  updateItem,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

/** A room "Linnea" with a Boardroom setup for 10 people. */
async function linnea() {
  const context = testContext();
  const type = await createRoomType({ context });
  const setup = unwrap({
    result: await execute({ operation: createSetup, input: { name: "Boardroom" }, context }),
  });
  const item = await createTestItem({ context, entityTypeId: type.id, name: "Linnea" });
  const setups = [{ setupId: setup.id, capacity: 10 }];
  unwrap({
    result: await execute({ operation: updateItem, input: { id: item.id, setups }, context }),
  });
  return { context, item, setup };
}

const fieldsOf = ({ change }: { change: RecordChangePreview | undefined }) =>
  Object.fromEntries(
    (change?.fields ?? []).map((field) => [field.path, [field.before, field.after]]),
  );

describe("previewChange (ADR 0049)", () => {
  it("shows two more seats as 10 → 12, with the setup's name, and writes nothing", async () => {
    const { context, item, setup } = await linnea();
    const input = { id: item.id, setups: [{ setupId: setup.id, capacity: 12 }] };
    const preview = unwrap({
      result: await previewChange({ operation: updateItem, input, context }),
    });
    const [change] = preview.changes;
    expect(change).toMatchObject({ entityType: "item", kind: "update", name: "Linnea" });
    expect(fieldsOf({ change })).toEqual({ [`setups.${setup.id}.capacity`]: [10, 12] });
    expect(preview.names[setup.id]).toBe("Boardroom");
    const after = unwrap({
      result: await execute({ operation: getItem, input: { id: item.id }, context }),
    });
    expect(after.setups).toEqual([{ setupId: setup.id, capacity: 10 }]);
  });

  it("fails like the command would, and checks the permission first", async () => {
    const { context, item } = await linnea();
    const missing = await previewChange({
      operation: updateItem,
      input: { id: "nope_000000000000000000", name: "X" },
      context,
    });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
    const viewer = { ...context, permissions: { item: ["read" as const] } };
    const denied = await previewChange({
      operation: updateItem,
      input: { id: item.id, name: "X" },
      context: viewer,
    });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
  });

  it("has no consequences when no quote uses the item's price", async () => {
    const { context, item } = await linnea();
    const input = { id: item.id, priceMinor: 450_000, priceUnit: "FLAT" as const };
    const preview = unwrap({
      result: await previewChange({ operation: updateItem, input, context }),
    });
    expect(preview.consequences).toEqual([]);
    expect(fieldsOf({ change: preview.changes[0] }).priceMinor).toEqual([null, 450_000]);
  });
});
