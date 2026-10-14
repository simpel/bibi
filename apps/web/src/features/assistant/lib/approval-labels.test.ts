import { describe, expect, it } from "vitest";
import { fieldKey, operationKey } from "./approval-labels";

describe("approval labels", () => {
  it("finds known fields and operations", () => {
    expect(fieldKey({ key: "priceMinor" })).toBe("priceMinor");
    expect(operationKey({ operation: "venue.create" })).toBe("venue_create");
  });

  it("returns null for unknown names so the raw name is shown", () => {
    expect(fieldKey({ key: "somethingNew" })).toBeNull();
    expect(operationKey({ operation: "booking.create" })).toBeNull();
  });
});
