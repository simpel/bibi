import { describe, expect, it } from "vitest";
import {
  workOrderDefinitionFormDefaults,
  workOrderDefinitionFormSchema,
  workOrderDefinitionFormToInput,
} from "./work-order-definition-form-schema";
import { fieldsOfTypes, namesOf } from "./work-order-options";

describe("work order definition form schema", () => {
  it("trims the name and keeps the chosen ids", () => {
    const values = {
      ...workOrderDefinitionFormDefaults({}),
      name: " Kitchen order ",
      responsibilityId: "r1",
    };
    expect(workOrderDefinitionFormToInput({ values })).toMatchObject({
      name: "Kitchen order",
      responsibilityId: "r1",
    });
  });

  it("validates with core's work order definition schema", () => {
    expect(
      workOrderDefinitionFormSchema.safeParse(workOrderDefinitionFormDefaults({})).success,
    ).toBe(false);
    const ok = workOrderDefinitionFormSchema.safeParse({
      ...workOrderDefinitionFormDefaults({}),
      name: "Kitchen order",
      responsibilityId: "r1",
    });
    expect(ok.success).toBe(true);
    const missing = workOrderDefinitionFormSchema.safeParse({
      ...workOrderDefinitionFormDefaults({}),
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
