import { describe, expect, it } from "vitest";
import { venueFormDefaults, venueFormSchema, venueFormToInput } from "./venue-form-schema";

const base = { ...venueFormDefaults({}), name: "Herrgården" };

describe("venue form schema", () => {
  it("maps blank inputs to null and parses numbers", () => {
    const input = venueFormToInput({ values: { ...base, city: " ", defaultVatRatePercent: "25" } });
    expect(input).toMatchObject({ name: "Herrgården", city: null, defaultVatRatePercent: 25 });
  });

  it("accepts a valid form through the core schema", () => {
    const parsed = venueFormSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it("reports issues on the field names the form uses", () => {
    const parsed = venueFormSchema.safeParse({
      ...base,
      name: "",
      contactEmail: "nope",
      defaultVatRatePercent: "abc",
    });
    expect(parsed.success).toBe(false);
    const paths = parsed.error?.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining(["name", "contactEmail", "defaultVatRatePercent"]),
    );
  });
});
