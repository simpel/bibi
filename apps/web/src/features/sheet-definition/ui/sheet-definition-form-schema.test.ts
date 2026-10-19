import { describe, expect, it } from "vitest";
import {
  sheetDefinitionFormDefaults,
  sheetDefinitionFormSchema,
  sheetDefinitionFormToInput,
} from "./sheet-definition-form-schema";
import { fieldsOfTypes, namesOf } from "./sheet-options";

describe("sheet definition form schema", () => {
  it("trims the name and keeps the chosen ids", () => {
    const values = {
      ...sheetDefinitionFormDefaults({}),
      name: " Kitchen order ",
      responsibilityId: "r1",
    };
    expect(sheetDefinitionFormToInput({ values })).toMatchObject({
      name: "Kitchen order",
      responsibilityId: "r1",
    });
  });

  it("validates with core's sheet definition schema", () => {
    expect(sheetDefinitionFormSchema.safeParse(sheetDefinitionFormDefaults({})).success).toBe(
      false,
    );
    const ok = sheetDefinitionFormSchema.safeParse({
      ...sheetDefinitionFormDefaults({}),
      name: "Kitchen order",
      responsibilityId: "r1",
    });
    expect(ok.success).toBe(true);
    const missing = sheetDefinitionFormSchema.safeParse({
      ...sheetDefinitionFormDefaults({}),
      name: "Kitchen order",
    });
    expect(missing.success).toBe(false);
  });

  it("offers the fields of the chosen types and names ids", () => {
    const types = [
      { id: "t1", name: "Dish", fields: [{ id: "f1", name: "Serving" }] },
      { id: "t2", name: "Drink", fields: [{ id: "f2", name: "Volume" }] },
    ];
    expect(fieldsOfTypes({ types, typeIds: ["t2"] })).toEqual([{ id: "f2", name: "Volume" }]);
    expect(namesOf({ ids: ["t1", "gone"], options: types })).toEqual(["Dish", "gone"]);
  });
});
