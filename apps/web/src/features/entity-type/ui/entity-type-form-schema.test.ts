import { describe, expect, it } from "vitest";
import {
  type EntityTypeFormValues,
  entityTypeFormSchema,
  entityTypeFormToInput,
} from "./entity-type-form-schema";

describe("entity type form schema", () => {
  it("keeps capabilities for item types only", () => {
    const item: EntityTypeFormValues = {
      ...{ base: "ITEM", name: " Rum ", capabilities: ["BOOKABLE"], resourceKind: "PERSON" },
      ...{ setupMinutes: "30", teardownMinutes: "" },
    };
    expect(entityTypeFormToInput({ values: item })).toMatchObject({
      ...{ capabilities: ["BOOKABLE"], setupMinutes: 30, teardownMinutes: null },
      resourceKind: "PERSON",
    });
    const customer: EntityTypeFormValues = { ...item, base: "CUSTOMER" };
    const input = entityTypeFormToInput({ values: customer });
    expect(input.capabilities).toBeUndefined();
    expect(input.resourceKind).toBeUndefined();
    expect(input).not.toHaveProperty("setupMinutes");
  });

  it("validates with core's type schema", () => {
    const blank = {
      capabilities: [],
      setupMinutes: "",
      teardownMinutes: "",
      resourceKind: "EQUIPMENT",
    };
    expect(entityTypeFormSchema.safeParse({ base: "ITEM", name: "", ...blank }).success).toBe(
      false,
    );
    const ok = entityTypeFormSchema.safeParse({ base: "ITEM", name: "Rum", ...blank });
    expect(ok.success).toBe(true);
    const negative = { base: "ITEM", name: "Rum", ...blank, setupMinutes: "-5" };
    expect(entityTypeFormSchema.safeParse(negative).success).toBe(false);
  });
});
