import { describe, expect, it } from "vitest";
import { demandFormDefaults, demandFormSchema } from "./demand-form-schema";

const schema = demandFormSchema({ itemId: "item-1" });

describe("demand form schema", () => {
  it("defaults to one mandatory unit held for the booking", () => {
    expect(demandFormDefaults({})).toMatchObject({
      required: true,
      quantity: "1",
      windows: ["BOOKING"],
    });
  });

  it("accepts a pool with a quantity and windows", () => {
    const parsed = schema.safeParse({
      entityTypeId: "type-1",
      required: false,
      quantity: "2",
      windows: ["SETUP", "BOOKING"],
    });
    expect(parsed.success && parsed.data).toMatchObject({
      itemId: "item-1",
      entityTypeId: "type-1",
      required: false,
      quantity: 2,
    });
  });

  it("rejects no pool, no windows and a blank quantity", () => {
    const base = { entityTypeId: "type-1", required: true, quantity: "1", windows: ["BOOKING"] };
    expect(schema.safeParse({ ...base, entityTypeId: "" }).success).toBe(false);
    expect(schema.safeParse({ ...base, windows: [] }).success).toBe(false);
    expect(schema.safeParse({ ...base, quantity: " " }).success).toBe(false);
  });
});
