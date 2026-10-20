import { describe, expect, it } from "vitest";
import {
  type EntityTypeFormValues,
  entityTypeFormSchema,
  entityTypeFormToInput,
} from "./entity-type-form-schema";

describe("entity type form schema", () => {
  it("keeps capabilities for item types only", () => {
    const item: EntityTypeFormValues = { base: "ITEM", name: " Rum ", capabilities: ["BOOKABLE"] };
    expect(entityTypeFormToInput({ values: item })).toMatchObject({ capabilities: ["BOOKABLE"] });
    const customer: EntityTypeFormValues = { ...item, base: "CUSTOMER" };
    expect(entityTypeFormToInput({ values: customer }).capabilities).toBeUndefined();
  });

  it("validates with core's type schema", () => {
    expect(
      entityTypeFormSchema.safeParse({ base: "ITEM", name: "", capabilities: [] }).success,
    ).toBe(false);
    const ok = entityTypeFormSchema.safeParse({ base: "ITEM", name: "Rum", capabilities: [] });
    expect(ok.success).toBe(true);
  });
});
