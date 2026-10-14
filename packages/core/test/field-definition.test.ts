import { describe, expect, it } from "vitest";
import {
  archiveFieldDefinition,
  createFieldDefinition,
  createVocabulary,
  execute,
  updateFieldDefinition,
  updateItem,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

type Context = ReturnType<typeof testContext>;

async function setUp({ context }: { context: Context }) {
  const type = await createRoomType({ context });
  const list = unwrap({
    result: await execute({
      operation: createVocabulary,
      input: { name: "View", values: ["River", "None"] },
      context,
    }),
  });
  const field = ({ input }: { input: Record<string, unknown> }) =>
    execute({
      operation: createFieldDefinition,
      input: { entityTypeId: type.id, ...input } as never,
      context,
    });
  const area = unwrap({ result: await field({ input: { name: "Area m²", kind: "NUMBER" } }) });
  const view = unwrap({
    result: await field({ input: { name: "View", kind: "CHOICE", vocabularyId: list.id } }),
  });
  const style = unwrap({
    result: await field({
      input: { name: "Style", kind: "MULTI_CHOICE", options: ["Light", "Dark"] },
    }),
  });
  const item = await createTestItem({ context, entityTypeId: type.id, name: "Vinga" });
  return { type, list, area, view, style, item, field };
}

describe("field definitions (ADR 0021)", () => {
  it("generates stable keys and validates choice sources", async () => {
    const context = testContext();
    const { area, list, field } = await setUp({ context });
    expect(area.key).toBe("area_m2");
    const again = unwrap({ result: await field({ input: { name: "Area m2", kind: "NUMBER" } }) });
    expect(again.key).toBe("area_m2_2");
    const both = await field({
      input: { name: "X", kind: "CHOICE", vocabularyId: list.id, options: ["a"] },
    });
    expect(errorCode({ result: both })).toBe("VALIDATION");
    const none = await field({ input: { name: "Y", kind: "CHOICE" } });
    expect(errorCode({ result: none })).toBe("VALIDATION");
    const textWithList = await field({ input: { name: "Z", kind: "TEXT", vocabularyId: list.id } });
    expect(errorCode({ result: textWithList })).toBe("VALIDATION");
  });

  it("validates item values against the definitions", async () => {
    const context = testContext();
    const { list, item } = await setUp({ context });
    const set = ({ fields }: { fields: Record<string, unknown> }) =>
      execute({ operation: updateItem, input: { id: item.id, fields }, context });
    const alven = list.values[0]?.id;
    const good = unwrap({
      result: await set({ fields: { area_m2: 260, view: alven, style: ["Light"] } }),
    });
    expect(good.fields).toEqual({ area_m2: 260, view: alven, style: ["Light"] });
    const bad = await set({ fields: { area_m2: "large", view: "nope", unknown: 1 } });
    expect(bad.ok ? [] : bad.error.issues.map((issue) => issue.path).sort()).toEqual([
      "fields.area_m2",
      "fields.unknown",
      "fields.view",
    ]);
    const cleared = unwrap({ result: await set({ fields: { style: null } }) });
    expect(cleared.fields).toEqual({ area_m2: 260, view: alven });
  });

  it("refuses changes that would orphan existing values (CONFLICT)", async () => {
    const context = testContext();
    const { area, style, item } = await setUp({ context });
    await execute({
      operation: updateItem,
      input: { id: item.id, fields: { area_m2: 90, style: ["Light"] } },
      context,
    });
    const update = ({ input }: { input: Record<string, unknown> }) =>
      execute({ operation: updateFieldDefinition, input: input as never, context });
    expect(errorCode({ result: await update({ input: { id: area.id, kind: "TEXT" } }) })).toBe(
      "CONFLICT",
    );
    expect(
      errorCode({ result: await update({ input: { id: style.id, options: ["Dark"] } }) }),
    ).toBe("CONFLICT");
    expect(
      errorCode({ result: await update({ input: { id: style.id, options: ["Light", "X"] } }) }),
    ).toBeNull();
    expect(
      errorCode({ result: await update({ input: { id: area.id, name: "Area" } }) }),
    ).toBeNull();
    const archive = await execute({
      operation: archiveFieldDefinition,
      input: { id: area.id },
      context,
    });
    expect(errorCode({ result: archive })).toBe("CONFLICT");
  });

  it("refuses to make a field required while items lack a value", async () => {
    const context = testContext();
    const { view, field } = await setUp({ context });
    const required = await execute({
      operation: updateFieldDefinition,
      input: { id: view.id, required: true },
      context,
    });
    expect(errorCode({ result: required })).toBe("CONFLICT");
    const newRequired = await field({ input: { name: "Floor", kind: "NUMBER", required: true } });
    expect(errorCode({ result: newRequired })).toBe("CONFLICT");
  });
});
