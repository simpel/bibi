import { describe, expect, it } from "vitest";
import {
  type EntityTypeFormValues,
  entityTypeFormSchema,
  entityTypeFormToInput,
  NO_GROUP,
} from "./entity-type-form-schema";

describe("entity type form schema", () => {
  it("keeps capabilities for item types only", () => {
    const item: EntityTypeFormValues = {
      ...{ base: "ITEM", name: " Rum ", capabilities: ["BOOKABLE"], resourceKind: "PERSON" },
      ...{ groupId: "g1", pluralName: " Rum " },
      ...{ setupMinutes: "30", teardownMinutes: "" },
    };
    expect(entityTypeFormToInput({ values: item })).toMatchObject({
      pluralName: "Rum",
      ...{ capabilities: ["BOOKABLE"], setupMinutes: 30, teardownMinutes: null },
      resourceKind: "PERSON",
      groupId: "g1",
    });
    const ungrouped = entityTypeFormToInput({ values: { ...item, groupId: NO_GROUP } });
    expect(ungrouped.groupId).toBeNull();
    const unnamed = entityTypeFormToInput({ values: { ...item, pluralName: "  " } });
    expect(unnamed.pluralName).toBeNull();
    const customer: EntityTypeFormValues = { ...item, base: "CUSTOMER" };
    const input = entityTypeFormToInput({ values: customer });
    expect(input.capabilities).toBeUndefined();
    expect(input.resourceKind).toBeUndefined();
    expect(input.groupId).toBeUndefined();
    expect(input).not.toHaveProperty("setupMinutes");
  });

  it("validates with core's type schema", () => {
    const blank = {
      capabilities: [],
      setupMinutes: "",
      teardownMinutes: "",
      resourceKind: "EQUIPMENT",
      groupId: "none",
      pluralName: "",
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
