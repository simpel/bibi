import { describe, expect, it } from "vitest";
import {
  addVocabularyValue,
  createVocabulary,
  execute,
  getItem,
  previewChange,
  type RecordChangePreview,
  updateItem,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

/** A room "Linnea" that holds at most 10 people. */
async function linnea() {
  const context = testContext();
  const type = await createRoomType({ context });
  const item = await createTestItem({ context, entityTypeId: type.id, name: "Linnea" });
  unwrap({
    result: await execute({
      operation: updateItem,
      input: { id: item.id, maxPeople: 10 },
      context,
    }),
  });
  return { context, item };
}

const fieldsOf = ({ change }: { change: RecordChangePreview | undefined }) =>
  Object.fromEntries(
    (change?.fields ?? []).map((field) => [field.path, [field.before, field.after]]),
  );

describe("previewChange (ADR 0049)", () => {
  it("shows two more people as 10 → 12 and writes nothing", async () => {
    const { context, item } = await linnea();
    const input = { id: item.id, maxPeople: 12 };
    const preview = unwrap({
      result: await previewChange({ operation: updateItem, input, context }),
    });
    const [change] = preview.changes;
    expect(change).toMatchObject({ entityType: "item", kind: "update", name: "Linnea" });
    expect(fieldsOf({ change })).toEqual({ maxPeople: [10, 12] });
    const after = unwrap({
      result: await execute({ operation: getItem, input: { id: item.id }, context }),
    });
    expect(after.maxPeople).toBe(10);
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

  it("names the list a value is added to", async () => {
    const context = testContext();
    const list = unwrap({
      result: await execute({ operation: createVocabulary, input: { name: "Allergens" }, context }),
    });
    const preview = unwrap({
      result: await previewChange({
        operation: addVocabularyValue,
        input: { vocabularyId: list.id, name: "Celery" },
        context,
      }),
    });
    expect(preview.names[list.id]).toBe("Allergens");
  });
});
