import { describe, expect, it } from "vitest";
import {
  type EntityTypeFormValues,
  entityTypeFormSchema,
  entityTypeFormToInput,
} from "./entity-type-form-schema";

describe("entity type form schema", () => {
  it("keeps behaviours for item types only", () => {
    const item: EntityTypeFormValues = { base: "ITEM", name: " Rum ", behaviours: ["BOOKABLE"] };
    expect(entityTypeFormToInput({ values: item })).toMatchObject({ behaviours: ["BOOKABLE"] });
    const customer: EntityTypeFormValues = { ...item, base: "CUSTOMER" };
    expect(entityTypeFormToInput({ values: customer }).behaviours).toBeUndefined();
  });

  it("validates with core's type schema", () => {
    expect(entityTypeFormSchema.safeParse({ base: "ITEM", name: "", behaviours: [] }).success).toBe(
      false,
    );
    const ok = entityTypeFormSchema.safeParse({ base: "ITEM", name: "Rum", behaviours: [] });
    expect(ok.success).toBe(true);
  });
});
