import { describe, expect, it } from "vitest";
import {
  runSheetDefinitionFormDefaults,
  runSheetDefinitionFormSchema,
  runSheetDefinitionFormToInput,
} from "./run-sheet-definition-form-schema";
import { fieldsOfTypes, namesOf } from "./run-sheet-options";

describe("run sheet definition form schema", () => {
  it("trims the name and keeps the chosen ids", () => {
    const values = {
      ...runSheetDefinitionFormDefaults({}),
      name: " Kitchen order ",
      responsibilityId: "r1",
    };
    expect(runSheetDefinitionFormToInput({ values })).toMatchObject({
      name: "Kitchen order",
      responsibilityId: "r1",
    });
  });

  it("validates with core's run sheet definition schema", () => {
    expect(runSheetDefinitionFormSchema.safeParse(runSheetDefinitionFormDefaults({})).success).toBe(
      false,
    );
    const ok = runSheetDefinitionFormSchema.safeParse({
      ...runSheetDefinitionFormDefaults({}),
      name: "Kitchen order",
      responsibilityId: "r1",
    });
    expect(ok.success).toBe(true);
    const missing = runSheetDefinitionFormSchema.safeParse({
      ...runSheetDefinitionFormDefaults({}),
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
