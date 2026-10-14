import { describe, expect, it } from "vitest";
import { fieldFormSchema, fieldFormToInput } from "./field-form-schema";

const base = {
  entityTypeId: "t1",
  name: "Yta",
  kind: "NUMBER",
  required: false,
  source: "list",
  vocabularyId: "",
  options: "",
} as const;

describe("field form schema", () => {
  it("sends no source for non-choice kinds", () => {
    const input = fieldFormToInput({ values: { ...base, options: "a" } });
    expect(input.vocabularyId).toBeUndefined();
    expect(input.options).toBeUndefined();
  });

  it("sends the chosen source for choice kinds", () => {
    const list = { ...base, kind: "CHOICE", vocabularyId: "v1" } as const;
    expect(fieldFormToInput({ values: list })).toMatchObject({ vocabularyId: "v1" });
    const own = { ...base, kind: "MULTI_CHOICE", source: "options", options: "A\n\n B " } as const;
    expect(fieldFormToInput({ values: own }).options).toEqual(["A", "B"]);
  });

  it("validates with core's field schema", () => {
    expect(fieldFormSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(fieldFormSchema.safeParse(base).success).toBe(true);
  });
});
