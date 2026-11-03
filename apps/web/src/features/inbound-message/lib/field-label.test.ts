import { describe, expect, it } from "vitest";
import { fieldLabel } from "./field-label";

describe("fieldLabel", () => {
  it("capitalises a single word", () => {
    expect(fieldLabel({ key: "guests" })).toBe("Guests");
  });

  it("splits camelCase, snake_case and kebab-case into words", () => {
    expect(fieldLabel({ key: "firstName" })).toBe("First name");
    expect(fieldLabel({ key: "first_name" })).toBe("First name");
    expect(fieldLabel({ key: "dietary-needs" })).toBe("Dietary needs");
  });

  it("keeps a key with no letters to split as it is", () => {
    expect(fieldLabel({ key: "__" })).toBe("__");
  });
});
