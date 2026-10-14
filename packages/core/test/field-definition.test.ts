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
      input: { name: "Utsikt", values: ["Älven", "Ingen"] },
      context,
    }),
  });
  const field = (input: Record<string, unknown>) =>
    execute({
      operation: createFieldDefinition,
      input: { entityTypeId: type.id, ...input } as never,
      context,
    });
  const area = unwrap({ result: await field({ name: "Yta m²", kind: "NUMBER" }) });
  const view = unwrap({ result: await field({ name: "Utsikt", kind: "CHOICE", vocabularyId: list.id }) });
  const style = unwrap({
    result: await field({ name: "Stil", kind: "MULTI_CHOICE", options: ["Ljus", "Mörk"] }),
  });
  const item = await createTestItem({ context, entityTypeId: type.id, name: "Vinga" });
  return { type, list, area, view, style, item, field };
}

describe("field definitions (ADR 0021)", () => {
  it("generates stable keys and validates choice sources", async () => {
    const context = testContext();
    const { area, list, field } = await setUp({ context });
    expect(area.key).toBe("yta_m2");
    const again = unwrap({ result: await field({ name: "Yta m2", kind: "NUMBER" }) });
    expect(again.key).toBe("yta_m2_2");
    const both = await field({ name: "X", kind: "CHOICE", vocabularyId: list.id, options: ["a"] });
    expect(errorCode({ result: both })).toBe("VALIDATION");
    const none = await field({ name: "Y", kind: "CHOICE" });
    expect(errorCode({ result: none })).toBe("VALIDATION");
    const textWithList = await field({ name: "Z", kind: "TEXT", vocabularyId: list.id });
    expect(errorCode({ result: textWithList })).toBe("VALIDATION");
  });

  it("validates item values against the definitions", async () => {
    const context = testContext();
    const { list, item } = await setUp({ context });
    const set = (fields: Record<string, unknown>) =>
      execute({ operation: updateItem, input: { id: item.id, fields }, context });
    const alven = list.values[0]?.id;
    const good = unwrap({ result: await set({ yta_m2: 260, utsikt: alven, stil: ["Ljus"] }) });
    expect(good.fields).toEqual({ yta_m2: 260, utsikt: alven, stil: ["Ljus"] });
    const bad = await set({ yta_m2: "stor", utsikt: "nope", okand: 1 });
    expect(bad.ok ? [] : bad.error.issues.map((issue) => issue.path).sort()).toEqual([
      "fields.okand",
      "fields.utsikt",
      "fields.yta_m2",
    ]);
    const cleared = unwrap({ result: await set({ stil: null }) });
    expect(cleared.fields).toEqual({ yta_m2: 260, utsikt: alven });
  });

  it("refuses changes that would orphan existing values (CONFLICT)", async () => {
    const context = testContext();
    const { area, style, item } = await setUp({ context });
    await execute({
      operation: updateItem,
      input: { id: item.id, fields: { yta_m2: 90, stil: ["Ljus"] } },
      context,
    });
    const update = (input: Record<string, unknown>) =>
      execute({ operation: updateFieldDefinition, input: input as never, context });
    expect(errorCode({ result: await update({ id: area.id, kind: "TEXT" }) })).toBe("CONFLICT");
    expect(errorCode({ result: await update({ id: style.id, options: ["Mörk"] }) })).toBe("CONFLICT");
    expect(errorCode({ result: await update({ id: style.id, options: ["Ljus", "X"] }) })).toBeNull();
    expect(errorCode({ result: await update({ id: area.id, name: "Area" }) })).toBeNull();
    const archive = await execute({ operation: archiveFieldDefinition, input: { id: area.id }, context });
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
    const newRequired = await field({ name: "Våning", kind: "NUMBER", required: true });
    expect(errorCode({ result: newRequired })).toBe("CONFLICT");
  });
});
